const RequestStrategy = require('../../../lib/strategy/RequestStrategy');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('Testsuite RequestStrategy', () => {

    let goodParams = {
        options: '{"uri": "/monitor/storage"}'
    };

    let clientStub;

    beforeEach(() => {
        clientStub = sinon.stub().returns(Promise.resolve('done'));
    });

    it('Testcase - isValid', () => {
        let strategy = new RequestStrategy({});
        expect(strategy.isValid({})).to.be.false;
        expect(strategy.isValid(goodParams)).to.be.true;
        expect(strategy.isValid({options: '{uri: "/monitor/storage"}'})).to.be.false;
        expect(strategy.isValid({options: '{"uri": "/monitor/storage}'})).to.be.false;
    });

    it('Testcase - execute', async () => {
        let strategy = new RequestStrategy({request: clientStub}, goodParams);
        let response = await strategy.execute();
        expect(response).to.equal('done');
        expect(clientStub.calledWith(
            undefined, JSON.parse(goodParams.options))).to.equal(true);
    });
});
