const debugNotice = require('debug')('db2-on-cloud-rest:notice');
const DB2RestClient = require('../../lib/Db2RestClient');
const expect = require('chai').expect;
let client;

/**
 * Creates a new table and attempts to perform a series of operations
 */
describe('INTEGRATION tests', () => {

    before(async () => {
        // runs before all tests in this block
        const {DB_PASSWORD: password, DB_USERID: userId, DB_URI: uri} = process.env;
        debugNotice('Credentials <userid=%s, pass=%s, uri=%s>', userId, password, uri);
        const config = {
            credentials: {
                userid: userId,
                password: password
            },
            uri: uri
        };
        client = new DB2RestClient(config);
        try {
            await client.bulkQueries('DROP TABLE INTEGR.TST_SAMPLE');
        } catch (err) {
            debugNotice('Expected to fail if table doesn\'t exist.', err.message);
        }
        await client.bulkQueries(`CREATE TABLE INTEGR.TST_SAMPLE (ID CHAR(5) NOT NULL,
        DESCRIPTION VARCHAR(200) NOT NULL, PRIMARY KEY(ID))`);
    });

    after(async () => {
        await client.bulkQueries('DROP TABLE INTEGR.TST_SAMPLE');
    });


    it('Test request method', async () => {
        let data = await client.request(undefined, {uri: '/schemas/INTEGR/tables'});
        expect(data).to.be.ok;
        expect(data.count).to.equal(1);
    });

    it('Test requestPolling method with failure', async () => {
        let error;
        try {
            let data = await client.request('SQL_JOBS', {
                body: {
                    'commands': 'SELECT COUNT(*) FROM INTEGR.TST_SAMPLE;SELECT COUNT(*) FROM INTEGR.NOT_THERE;'
                }
            });
            await client.requestPolling(undefined, {uri: '/sql_jobs/' + data['id']});
        } catch (err) {
            error = err;
        }

        expect(error).to.be.ok;
        expect(error.statusCode).to.equal(500);
    });

    it('Test requestPolling method with success', async () => {
        let data = await client.request('SQL_JOBS',
            {
                body: {
                    'commands': `SELECT COUNT(*) FROM INTEGR.TST_SAMPLE;
                    INSERT INTO INTEGR.TST_SAMPLE VALUES ('0010', 'Some data')`
                }
            });
        data = await client.requestPolling(null, {uri: '/sql_jobs/' + data['id']});
        expect(data).to.deep.include({status: 'completed'});
    });

    it('Test query method with success', async () => {
        let data = await client.query('SELECT ID, DESCRIPTION FROM INTEGR.TST_SAMPLE WHERE 1');
        expect(data).to.be.ok;
        expect(data.length).to.equal(1);
        expect(data[0]).to.deep.equal({ID: '0010', DESCRIPTION: 'Some data'});
    });

    it('Test upload method with success', async () => {
        let data = await client.upload('./test/data/sample2.csv');
        expect(data).to.be.ok;
        expect(data.resources[0]).to.deep.include({
            'name': 'sample2.csv',
            'location': '/home/load/sample2.csv'
        });
    });

    it('Test loadJob method with success', async () => {
        await client.bulkQueries('DELETE FROM INTEGR.TST_SAMPLE WHERE 1');
        await client.upload('./test/data/sample2.csv');
        let data = await client.loadFromServer('sample2.csv', 'TST_SAMPLE', 'INTEGR', false);
        expect(data).to.be.ok;
        expect(data.status.status).to.equal('Success');
        let loadRes = await client.query('SELECT COUNT(*) AS TOTAL FROM INTEGR.TST_SAMPLE');
        expect(loadRes[0]['TOTAL']).to.equal('2');
    });

    it('Test load method with success', async () => {
        // load / upload is by default REPLACE
        let data = await client.load('./test/data/sample1.csv', 'TST_SAMPLE', 'INTEGR');
        expect(data).to.be.ok;
        expect(data.status.status).to.equal('Success');
        let loadRes = await client.query('SELECT COUNT(*) AS TOTAL FROM INTEGR.TST_SAMPLE');
        expect(loadRes[0]['TOTAL']).to.equal('4');
    });

});
