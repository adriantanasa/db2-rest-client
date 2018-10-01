const StrategyFactory = require('../../lib/StrategyFactory');
const QueryStrategy = require('../../lib/strategy/QueryStrategy');
const BatchStrategy = require('../../lib/strategy/BatchStrategy');
const LoadStrategy = require('../../lib/strategy/LoadStrategy');
const LoadInPlaceStrategy = require('../../lib/strategy/LoadInPlaceStrategy');
const HelpStrategy = require('../../lib/strategy/HelpStrategy');
const expect = require('chai').expect;
const factory = new StrategyFactory({});

describe('Testsuite StrategyFactory', () => {

    it('Testcase - create - query', () => {
        let strategy = factory.create('query', []);
        expect(strategy instanceof QueryStrategy).to.be.true;
    });

    it('Testcase - create - batch', () => {
        let strategy = factory.create('batch', []);
        expect(strategy instanceof BatchStrategy).to.be.true;
    });

    it('Testcase - create - load', () => {
        let strategy = factory.create('load', []);
        expect(strategy instanceof LoadStrategy).to.be.true;
    });

    it('Testcase - create - load-in-place', () => {
        let strategy = factory.create('load-in-place', []);
        expect(strategy instanceof LoadInPlaceStrategy).to.be.true;
    });

    it('Testcase - create - help', () => {
        let strategy = factory.create();
        expect(strategy instanceof HelpStrategy).to.be.true;
    });

});
