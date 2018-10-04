const RequestPollingStrategy = require('../../../lib/strategy/RequestPollingStrategy');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('Testsuite RequestPollingStrategy', () => {

    let goodParams = {
        options: '{"uri": "/load_jobs/001"}'
    };

    let goodParamsWithOptionals = {
        options: '{"uri": "/load_jobs/001"}',
        success: '{"status": "Success"}',
        failed: '{"status": "Failed"}',
        pollingMaxRetries: 100,
        pollingWait: 500
    };

    let clientStub;

    beforeEach(() => {
        clientStub = sinon.stub().returns(Promise.resolve('done'));
    });

    it('Testcase - isValid', () => {
        let strategy = new RequestPollingStrategy({});
        expect(strategy.isValid({})).to.be.false;
        expect(strategy.isValid(goodParams)).to.be.true;
        expect(strategy.isValid(goodParamsWithOptionals)).to.be.true;
        expect(strategy.isValid({options: '{uri: "/load_jobs/001"}'})).to.be.false;
        expect(strategy.isValid({options: '{"uri": "/load_jobs/001}'})).to.be.false;
        // optional params
        expect(strategy.isValid(Object.assign({}, goodParams, {type: undefined}))).to.be.true;
        expect(strategy.isValid(Object.assign({}, goodParams, {extra: '{"id": "test"}'}))).to.be.true;
    });

    it('Testcase - execute', async () => {
        let strategy = new RequestPollingStrategy({requestPolling: clientStub}, goodParams);
        let response = await strategy.execute();
        expect(response).to.equal('done');
        expect(clientStub.calledWith(
            undefined,
            JSON.parse(goodParams.options),
            undefined,
            undefined,
            undefined,
            undefined,
            undefined)).to.equal(true);
    });

    it('Testcase - execute - optionals', async () => {
        let strategy = new RequestPollingStrategy({requestPolling: clientStub}, goodParamsWithOptionals);
        let response = await strategy.execute();
        expect(response).to.equal('done');
        expect(clientStub.calledWith(
            undefined,
            JSON.parse(goodParamsWithOptionals.options),
            JSON.parse(goodParamsWithOptionals.success),
            JSON.parse(goodParamsWithOptionals.failed),
            undefined,
            goodParamsWithOptionals.pollingMaxRetries,
            goodParamsWithOptionals.pollingWait)).to.equal(true);
    });
});
