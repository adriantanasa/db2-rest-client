const debugNotice = require('debug')('db2-rest-client:notice');
const Db2RestClient = require('../../lib/Db2RestClient');
const expect = require('chai').expect;
let client;
// Some of the plans don't have access for creating new schema (Db2 Warehouse - Entry)
let dbSchema = 'INTEGR';

/**
 * Creates a new table and attempts to perform a series of operations
 */
describe('INTEGRATION tests', () => {

    before(async () => {
        // runs before all tests in this block
        const {DB_PASSWORD: password, DB_USERID: userId, DB_URI: uri, DB_NEW_SCHEMA: dbNewSchema} = process.env;
        if (dbNewSchema !== 'true') dbSchema = userId.toUpperCase();
        debugNotice('Credentials <userid=%s, pass=%s, uri=%s, schema=%s>', userId, password, uri, dbSchema);

        const config = {
            credentials: {
                userid: userId,
                password: password
            },
            uri: uri
        };
        client = new Db2RestClient(config);
        try {
            await client.bulkQueries(`DROP TABLE ${dbSchema}.TST_SAMPLE`);
        } catch (err) {
            debugNotice('Expected to fail if table doesn\'t exist.', err.message);
        }
        await client.bulkQueries(`CREATE TABLE ${dbSchema}.TST_SAMPLE (ID CHAR(5) NOT NULL,
        DESCRIPTION VARCHAR(200) NOT NULL, PRIMARY KEY(ID))`);
    });

    after(async () => {
        await client.bulkQueries(`DROP TABLE ${dbSchema}.TST_SAMPLE`);
    });


    it.only('Test request method', async () => {
        let data = await client.request(undefined, {uri: `/schemas/${dbSchema}/tables`});
        expect(data).to.be.ok;
        expect(data.count).to.equal(1);
    });

    it('Test requestPolling method with failure', async () => {
        let error;
        try {
            let data = await client.request('SQL_JOBS', {
                body: {
                    'commands':
                        `SELECT COUNT(*) FROM ${dbSchema}.TST_SAMPLE;SELECT COUNT(*) FROM ${dbSchema}.NOT_THERE;`
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
                    'commands': `SELECT COUNT(*) FROM ${dbSchema}.TST_SAMPLE;
                    INSERT INTO ${dbSchema}.TST_SAMPLE VALUES ('0010', 'Some data')`
                }
            });
        data = await client.requestPolling(null, {uri: '/sql_jobs/' + data['id']});
        expect(data).to.deep.include({status: 'completed'});
    });

    it('Test query method with success', async () => {
        let data = await client.query(`SELECT ID, DESCRIPTION FROM ${dbSchema}.TST_SAMPLE WHERE 1`);
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
        await client.bulkQueries(`DELETE FROM ${dbSchema}.TST_SAMPLE WHERE 1`);
        await client.upload('./test/data/sample2.csv');
        let data = await client.loadFromServer('sample2.csv', 'TST_SAMPLE', dbSchema, false);
        expect(data).to.be.ok;
        expect(data.status.status).to.equal('Success');
        let loadRes = await client.query(`SELECT COUNT(*) AS TOTAL FROM ${dbSchema}.TST_SAMPLE`);
        expect(loadRes[0]['TOTAL']).to.equal('2');
    });

    it('Test load method with success', async () => {
        // load / upload is by default REPLACE
        let data = await client.load('./test/data/sample1.csv', 'TST_SAMPLE', dbSchema);
        expect(data).to.be.ok;
        expect(data.status.status).to.equal('Success');
        let loadRes = await client.query(`SELECT COUNT(*) AS TOTAL FROM ${dbSchema}.TST_SAMPLE`);
        expect(loadRes[0]['TOTAL']).to.equal('4');
    });

});
