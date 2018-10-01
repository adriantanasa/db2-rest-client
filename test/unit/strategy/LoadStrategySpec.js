const LoadStrategy = require('../../../lib/strategy/LoadStrategy');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('Testsuite LoadStrategy', () => {

    let goodParams = {
        file: './test/data/sample1.csv',
        table: 'MY_TABLE',
        schema: 'MY_SCHEMA',
        type: 'INSERT',
        extra: '{}'
    };

    let clientStub;

    beforeEach(() => {
        clientStub = sinon.stub().returns(Promise.resolve('done'));
    });

    it('Testcase - isValid', () => {
        let strategy = new LoadStrategy({});
        expect(strategy.isValid({})).to.be.false;
        expect(strategy.isValid(goodParams)).to.be.true;
        expect(strategy.isValid(Object.assign({}, goodParams, {file: ''}))).to.be.false;
        expect(strategy.isValid(Object.assign({}, goodParams, {file: 'test.csv'}))).to.be.false;
        expect(strategy.isValid(Object.assign({}, goodParams, {table: ''}))).to.be.false;
        expect(strategy.isValid(Object.assign({}, goodParams, {schema: ''}))).to.be.false;
        // optional params
        expect(strategy.isValid(Object.assign({}, goodParams, {type: undefined}))).to.be.true;
        expect(strategy.isValid(Object.assign({}, goodParams, {extra: '{"id": "test"}'}))).to.be.true;
    });

    it('Testcase - execute', async () => {
        let strategy = new LoadStrategy({load: clientStub}, goodParams);
        let response = await strategy.execute();
        expect(response).to.equal('done');
        expect(clientStub.calledWith(
            goodParams.file, goodParams.table, goodParams.schema, false, {}
        )).to.equal(true);
    });

    it('Testcase - execute - replace mode', async () => {
        let strategy = new LoadStrategy(
            {load: clientStub},
            Object.assign({}, goodParams, {type: 'REPLACE'}));
        let response = await strategy.execute();
        expect(response).to.equal('done');
        expect(clientStub.calledWith(
            goodParams.file, goodParams.table, goodParams.schema, true
        )).to.equal(true);
    });

});
