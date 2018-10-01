const HelpStrategy = require('../../../lib/strategy/HelpStrategy');
const expect = require('chai').expect;

describe('Testsuite HelpStrategy', () => {

    it('Testcase - isValid', () => {
        let strategy = new HelpStrategy();
        expect(strategy.isValid()).to.be.true;
    });

    it('Testcase - isJSONOutput', () => {
        let strategy = new HelpStrategy();
        expect(strategy.isJSONOutput()).to.be.false;
    });

    it('Testcase - execute', async () => {
        let strategy = new HelpStrategy();
        let response = await strategy.execute();
        expect(response).to.match(/Executes a cli job against IBM Db2 Warehouse on Cloud REST API/i);
    });

});
