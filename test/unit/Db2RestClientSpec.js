const Db2RestClient = require('../../lib/Db2RestClient');
const expect = require('chai').expect;
const sinon = require('sinon');
const nock = require('nock');

describe('Testsuite Db2RestClient', () => {

    const goodParams = {
        credentials: {
            userid: 'userId',
            password: 'password'
        },
        uri: 'https://hostname',
        'pollingWait': 100,
        'pollingMaxRetries': 100
    };

    const goodToken = {token: 'authtokenid'};

    let error;

    beforeEach(() => {
        error = null;
    });

    after(() => {
        nock.restore();
    });

    it('Testcase - Constructor - default params', () => {
        let client = new Db2RestClient();
        expect(client).to.be.ok;
        expect(client.credentials).to.equal(undefined);
        expect(client.uri).to.equal(undefined);
        expect(client.authKey).to.equal(null);
        expect(client.optionsBuilder).to.equal(null);
        expect(client.pollingWait).to.equal(3000);
        expect(client.pollingMaxRetries).to.equal(20);
    });

    it('Testcase - Constructor - valid params', () => {
        let client = new Db2RestClient(goodParams);
        expect(client).to.be.ok;
        expect(client.credentials).to.deep.equal({
            userid: 'userId',
            password: 'password'
        });
        expect(client.uri).to.equal('https://hostname');
        expect(client.authKey).to.equal(null);
        expect(client.optionsBuilder).to.equal(null);
        expect(client.pollingWait).to.equal(100);
        expect(client.pollingMaxRetries).to.equal(100);
    });

    it('Testcase - get cached Oauth', async () => {
        let client = new Db2RestClient(goodParams);
        client.authKey = 'refreshed';
        let newKey = await client.getOauthKey();
        expect(newKey).to.equal('refreshed');
    });

    it('Testcase - get Oauth - no credentials', async () => {
        let client = new Db2RestClient(Object.assign({}, goodParams, {credentials: {}}));

        try {
            await client.getOauthKey(true);
        } catch (err) {
            error = err;
        }
        expect(error).to.be.ok;
        expect(error.message).to.equal('Credentials required!');
    });

    it('Testcase - getOauthKey', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken);
        let client = new Db2RestClient(goodParams);
        client.authKey = 'none';
        let data = await client.getOauthKey(true);
        expect(data).to.equal('authtokenid');
        expect(client.authKey).to.equal('authtokenid');
    });

    it('Testcase - getOauthKey - failure', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(401, {});

        try {
            let client = new Db2RestClient(goodParams);
            await client.getOauthKey(true);
        } catch (err) {
            error = err;
        }
        expect(error).to.be.ok;
    });

    it('Testcase - request - success', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .get('/schema')
            .reply(200, {});
        let client = new Db2RestClient(goodParams);
        let stub = sinon.spy(client, 'getOptions');

        let data = await client.request(undefined, {uri: '/schema'});
        expect(data).to.deep.equal({});
        expect(stub.calledWith('DEFAULT', sinon.match.any)).to.equal(true);
    });

    it('Testcase - request - oauth error', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(500, {});

        try {
            let client = new Db2RestClient(goodParams);
            await client.request(undefined, {uri: '/schema'});
        } catch (err) {
            error = err;
        }
        expect(error).to.be.ok;
        expect(error.statusCode).to.equal(500);
    });

    it('Testcase - request - api error', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .get('/schema')
            .reply(500, {});

        try {
            let client = new Db2RestClient(goodParams);
            await client.request(undefined, {uri: '/schema'});
        } catch (err) {
            error = err;
        }
        expect(error).to.be.ok;
        expect(error.statusCode).to.equal(500);
    });

    it('Testcase - request - authorization expired', async () => {
        nock(goodParams.uri)
            .get('/schema')
            .reply(401, {})
            .post('/auth/tokens')
            .reply(200, goodToken)
            .get('/schema')
            .reply(200, {});

        let client = new Db2RestClient(goodParams);
        client.authKey = 'expired';
        let data = await client.request(undefined, {uri: '/schema'});
        expect(data).to.deep.equal({});
        expect(client.authKey).to.deep.equal(goodToken.token);
    });

    it('Testcase - requestPolling - success - first try', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: ['something'], status: 'completed'});
        let client = new Db2RestClient(goodParams);
        client.authKey = null;
        let data = await client.requestPolling('DEFAULT', {uri: '/sql_jobs/jobid0001'});
        expect(data.results).to.deep.equal(['something']);
    });

    it('Testcase - requestPolling - success - multiple statuses', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: ['something'], status: 'Success with failure'})
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: ['something else'], status: 'Success'});
        let client = new Db2RestClient(goodParams);
        client.authKey = null;
        let successStatuses = [{status: 'Success with failure'}, {status: 'Success'}];
        let data = await client.requestPolling('DEFAULT', {uri: '/sql_jobs/jobid0001'},
            successStatuses);
        expect(data.results).to.deep.equal(['something']);
        data = await client.requestPolling('DEFAULT', {uri: '/sql_jobs/jobid0001'}, successStatuses);
        expect(data.results).to.deep.equal(['something else']);
    });

    it('Testcase - requestPolling - success - multiple tries', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: [], status: 'In progress'})
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: [], status: 'In progress'})
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: ['something'], status: 'completed'});
        let client = new Db2RestClient(goodParams);
        client.authKey = null;
        let data = await client.requestPolling('DEFAULT', {uri: '/sql_jobs/jobid0001'});
        expect(data.results).to.deep.equal(['something']);
    });

    it('Testcase - requestPolling - failed - multiple calls', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: [], status: 'In progress'})
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: [], status: 'failed'});
        let client = new Db2RestClient(goodParams);
        client.authKey = null;
        try {
            await client.requestPolling('DEFAULT', {uri: '/sql_jobs/jobid0001'});
        } catch (err) {
            error = err;
        }

        expect(error).to.be.ok;
        expect(error.message).to.equal('Query failed');
    });

    it('Testcase - requestPolling - failure - retry reached', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: [], status: 'In progress'})
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: [], status: 'In progress'})
            .get('/sql_jobs/jobid0001')
            .reply(200, {results: [], status: 'completed'});
        let client = new Db2RestClient(goodParams);
        client.authKey = null;
        try {
            await client.requestPolling('DEFAULT', {uri: '/sql_jobs/jobid0001'}, undefined, undefined, 0, 1);
        } catch (err) {
            error = err;
        }

        expect(error).to.be.ok;
        expect(error.message).to.equal('Failed to complete job in limits');
    });

    it('Testcase - query - success', async () => {
        let query = 'SELECT COL1, COL2 FROM MY_SCHEMA.MY_TABLE WHERE 1';
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .post('/sql_query_export', {command: query})
            .reply(200, `COL1, COL2
ID 01,Data 01
ID 01,Data 02`);
        let client = new Db2RestClient(goodParams);
        let data = await client.query(query);
        expect(data).to.deep.equal([{
            'COL1': 'ID 01',
            'COL2': 'Data 01'
        },
        {
            'COL1': 'ID 01',
            'COL2': 'Data 02'
        }]);
    });

    it('Testcase - bulkQueries - success', async () => {
        let query = 'UPDATE MY_SCHEMA.MY_TABLE SET COL1 =\'test\'';
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .post('/sql_jobs', {
                'commands': 'UPDATE MY_SCHEMA.MY_TABLE SET COL1 =\'test\'',
                'limit': 1000,
                'separator': ';',
                'stop_on_error': 'yes'}
            )
            .reply(200, {'id': 'jobid0003'})
            .get('/sql_jobs/jobid0003')
            .reply(200, {results: [{data: 'test'}], status: 'completed'});
        let client = new Db2RestClient(goodParams);
        let data = await client.bulkQueries(query);
        expect(data.results).to.deep.equal([{data: 'test'}]);
    });

    it('Testcase - upload - success', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .post('/home_content/load',
                undefined,
                {'content-type': 'multipart/form-data; boundary=--------------------------497597433229826610009626'})
            .reply(200, {'status': 'complete'});
        let client = new Db2RestClient(goodParams);
        let data = await client.upload('./test/data/sample1.csv');
        expect(data.status).to.equal('complete');
    });

    it('Testcase - upload - failure', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken);
        let client = new Db2RestClient(goodParams);

        try {
            await client.upload('somewrongpath.csv');
        } catch (err) {
            error = err;
        }

        expect(error).to.be.ok;
        expect(error.message).to.equal('Invalid file path');
    });

    it('Testcase - loadFromServer - success - Success', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .post('/load_jobs', body => (body.server_source.file_path == 'load/sample1.csv'))
            .reply(200, {'id': 'uploadid0001'})
            .get('/load_jobs/uploadid0001')
            .reply(200, {status: {status: 'Success'}});
        let client = new Db2RestClient(goodParams);
        let data = await client.loadFromServer('sample1.csv', 'MY_TABLE', 'MY_SCHEMA');
        expect(data.status).to.deep.equal({status: 'Success'});
    });

    it('Testcase - loadFromServer - success - Success', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .post('/load_jobs', body => (body.server_source.file_path == 'load/sample1.csv'))
            .reply(200, {'id': 'uploadid0001'})
            .get('/load_jobs/uploadid0001')
            .reply(200, {status: {status: 'Success with errors/warnings'}});
        let client = new Db2RestClient(goodParams);
        let data = await client.loadFromServer('sample1.csv', 'MY_TABLE', 'MY_SCHEMA');
        expect(data.status).to.deep.equal({status: 'Success with errors/warnings'});
    });

    it('Testcase - loadFromServer - Failure', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .post('/load_jobs', body => (body.server_source.file_path == 'load/sample1.csv'))
            .reply(200, {'id': 'uploadid0001'})
            .get('/load_jobs/uploadid0001')
            .reply(200, {status: {status: 'Failure'}});
        let client = new Db2RestClient(goodParams);
        try {
            await client.loadFromServer('sample1.csv', 'MY_TABLE', 'MY_SCHEMA');
        } catch (err) {
            error = err;
        }

        expect(error).to.be.ok;
        expect(error.message).to.equal('Query failed');
    });

    it('Testcase - load - success', async () => {
        nock(goodParams.uri)
            .post('/auth/tokens')
            .reply(200, goodToken)
            .post('/home_content/load',
                undefined,
                {'content-type': 'multipart/form-data; boundary=--------------------------497597433229826610009626'})
            .reply(200, {'status': 'complete'})
            .post('/load_jobs', body => (body.server_source.file_path == 'load/sample1.csv'))
            .reply(200, {'id': 'uploadid0001'})
            .get('/load_jobs/uploadid0001')
            .reply(200, {status: {status: 'Success'}});
        let client = new Db2RestClient(goodParams);
        let data = await client.load('./test/data/sample1.csv', 'MY_TABLE', 'MY_SCHEMA');
        expect(data.status).to.deep.equal({status: 'Success'});
    });

});
