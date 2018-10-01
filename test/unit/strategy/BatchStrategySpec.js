const BatchStrategy = require('../../../lib/strategy/BatchStrategy');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('Testsuite BatchStrategy', () => {

    it('Testcase - isValid', () => {
        let strategy = new BatchStrategy({});
        expect(strategy.isValid({query: 'test'})).to.be.true;
        expect(strategy.isValid({query: null})).to.be.false;
        expect(strategy.isValid({})).to.be.false;
    });

    it('Testcase - execute', async () => {
        let clientStub = sinon.stub().returns(Promise.resolve('done'));
        let strategy = new BatchStrategy({bulkQueries: clientStub}, {'query': 'test'});
        let response = await strategy.execute();
        expect(response).to.equal('done');
        expect(clientStub.calledWith('test')).to.equal(true);
    });

});
