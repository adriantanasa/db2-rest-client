const debug = require('debug')('db2-on-cloud-rest');
const DB2RestClient = require('../../lib/DB2RestClient');

const expect = require('chai').expect;
let client;

// TBD mock endpoint - create sample data
describe('Testsuite INTEGRATION', () => {

    before(function() {
        // runs before all tests in this block
        const {DB_PASSWORD: password, DB_USERID: userId, DB_URI: uri} = process.env;
        debug('Credentials <userid=%s, pass=%s, uri=%s>', userId, password, uri);
        const config = {
            credentials: {
                userid: userId,
                password: password
            },
            uri: uri
        };
        client = new DB2RestClient(config);
    });

    it('Test request success', async () => {
        let data = await client.request(undefined, {uri: '/schemas'});
        expect(data).to.be.ok;
        expect(data['count']).to.equal(33);
    });

    it('Test requestPolling failure', async () => {
        let error;
        try {
            let data = await client.request('SQL_JOBS', {
                body: {
                    'commands': 'SELECT COUNT(*) FROM COMPANY.COMPANY;SELECT COUNT(*) FROM COMPANY.COMPANY2;'
                }
            });
            await client.requestPolling(undefined, {uri: '/sql_jobs/' + data['id']});
        } catch (err) {
            error = err;
        }

        expect(error).to.be.ok;
        expect(error.statusCode).to.equal(500);
    });

    it('Test requestPolling success', async () => {
        let data = await client.request('SQL_JOBS',
            {
                body: {
                    'commands': 'SELECT COUNT(*) FROM COMPANY.COMPANY WHERE 1;'
                }
            });
        data = await client.requestPolling(null, {uri: '/sql_jobs/' + data['id']});
        expect(data).to.deep.include({status: 'completed'});
    });

    it('Test query success', async () => {
        let data = await client.query('SELECT CODE FROM MANUAL.PG_TO_LEVEL20GBT ORDER BY CODE LIMIT 0,2');
        expect(data).to.be.ok;
        expect(data.length).to.equal(2);
    });

    it('Test upload success', async () => {
        let data = await client.upload('./test/data/test.csv');
        expect(data).to.be.ok;
        expect(data.resources[0]).to.deep.include({
            'name': 'test.csv',
            'location': '/home/load/test.csv'
        });
    });

    it('Test loadJob success', async () => {
        await client.upload('./test/data/test.csv');
        let data = await client.loadFromServer('test.csv', 'LOAD_TEST', 'MANUAL', true);
        expect(data).to.be.ok;
        expect(data.status.status).to.equal('Success');
    });

    it('Test loadJob success', async () => {
        let data = await client.load('./test/data/test.csv', 'LOAD_TEST', 'MANUAL', true);
        expect(data).to.be.ok;
        expect(data.status.status).to.equal('Success');
    });

});
