const JobStrategy = require('../../../lib/strategy/JobStrategy');
const expect = require('chai').expect;

describe('Testsuite JobStrategy', () => {

    it('Testcase - isValid', () => {
        let strategy = new JobStrategy();
        expect(strategy.isValid()).to.be.false;
    });

    it('Testcase - isJSONOutput', () => {
        let strategy = new JobStrategy();
        expect(strategy.isJSONOutput()).to.be.true;
    });

    it('Testcase - isJSONOutput', () => {
        let client = {query: () => {}};
        let strategy = new JobStrategy(client);
        expect(strategy.getClient()).to.equal(client);
    });

    it('Testcase - execute - missing arguments', async () => {
        let strategy = new JobStrategy();
        let error;

        try {
            await strategy.execute();
        } catch (err) {
            error = err;
        }
        expect(error).to.be.ok;
        expect(error.message).to.equal('Missing required arguments');
    });

    it('Testcase - execute', async () => {
        let strategy = new JobStrategy({}, {query: 'test'});
        let error;
        try {
            await strategy.execute();
        } catch (err) {
            error = err;
        }
        expect(error).not.to.be.ok;
    });

});
