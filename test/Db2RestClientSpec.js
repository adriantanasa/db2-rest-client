const Db2RestClient = require('../lib/Db2RestClient');

const expect = require('chai').expect;

describe('Testsuite Db2RestClient', () => {
    it('Testcase - Constructor - default params', () => {
        let client = new Db2RestClient();
        expect(client).to.be.ok;
    });
});
