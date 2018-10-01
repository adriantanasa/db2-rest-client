const LoadInPlaceStrategy = require('../../../lib/strategy/LoadInPlaceStrategy');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('Testsuite LoadInPlaceStrategy', () => {

    let goodParams = {
        file: './test/data/sample1.csv',
        table: 'MY_TABLE',
        schema: 'MY_SCHEMA',
        extra: '{}'
    };

    let clientStub;

    beforeEach(() => {
        clientStub = {
            query: sinon.stub(),
            bulkQueries: sinon.stub(),
            load: sinon.stub()
        };
    });

    it('Testcase - isValid', () => {
        let strategy = new LoadInPlaceStrategy({});
        expect(strategy.isValid({})).to.be.false;
        expect(strategy.isValid(goodParams)).to.be.true;
        expect(strategy.isValid(Object.assign({}, goodParams, {file: ''}))).to.be.false;
        expect(strategy.isValid(Object.assign({}, goodParams, {file: 'test.csv'}))).to.be.false;
        expect(strategy.isValid(Object.assign({}, goodParams, {table: ''}))).to.be.false;
        expect(strategy.isValid(Object.assign({}, goodParams, {schema: ''}))).to.be.false;
        // optional params
        expect(strategy.isValid(Object.assign({}, goodParams, {extra: '{"id": "test"}'}))).to.be.true;
    });

    it('Testcase - execute - failure - no table', async () => {
        clientStub.query.onCall(0).returns(Promise.resolve([
            {TOTAL: '0'},
            {TOTAL: '0'},
            {TOTAL: '0'}
        ]));

        let strategy = new LoadInPlaceStrategy(clientStub, goodParams);
        let error;

        try {
            await strategy.execute();
        } catch (err) {
            error = err;
        }

        expect(error).to.be.ok;
        expect(error.message).to.equal('Target table not found');
        expect(clientStub.query.called).to.equal(true);
        expect(clientStub.bulkQueries.called).to.equal(false);
    });

    it('Testcase - execute - failure - no table', async () => {
        clientStub.query.onCall(0).returns(Promise.resolve([
            {TOTAL: '1'},
            {TOTAL: '1'},
            {TOTAL: '1'}
        ]));
        clientStub.bulkQueries
            .onCall(0).returns(Promise.resolve({}));
        clientStub.load.returns(Promise.reject(new Error('Load failure')));
        let strategy = new LoadInPlaceStrategy(clientStub, goodParams);
        let error;

        try {
            await strategy.execute();
        } catch (err) {
            error = err;
        }

        expect(error).to.be.ok;
        expect(error.message).to.equal('Load failure');
        expect(clientStub.query.called).to.equal(true);
        expect(clientStub.bulkQueries.callCount).to.equal(2);
    });

    it('Testcase - execute - success - no drop', async () => {
        clientStub.query.onCall(0).returns(Promise.resolve([
            {TOTAL: '1'},
            {TOTAL: '0'},
            {TOTAL: '0'}
        ]));
        clientStub.bulkQueries
            .onCall(0).returns(Promise.resolve({}))
            .onCall(1).returns(Promise.resolve({}));
        clientStub.load.returns(Promise.resolve({status: 'Success'}));
        let strategy = new LoadInPlaceStrategy(clientStub, goodParams);
        await strategy.execute();
        expect(clientStub.query.called).to.equal(true);
        expect(clientStub.bulkQueries.callCount).to.equal(2);
    });

    it('Testcase - execute - success - drop tables', async () => {
        clientStub.query.onCall(0).returns(Promise.resolve([
            {TOTAL: '1'},
            {TOTAL: '1'},
            {TOTAL: '1'}
        ]));
        clientStub.bulkQueries
            .onCall(0).returns(Promise.resolve({}))
            .onCall(1).returns(Promise.resolve({}))
            .onCall(2).returns(Promise.resolve({}));
        clientStub.load.returns(Promise.resolve({status: 'Success'}));
        let strategy = new LoadInPlaceStrategy(clientStub, goodParams);
        await strategy.execute();
        expect(clientStub.query.called).to.equal(true);
        expect(clientStub.bulkQueries.callCount).to.equal(3);
    });

});
