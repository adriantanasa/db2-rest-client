const QueryStrategy = require('./strategy/QueryStrategy');
const BatchStrategy = require('./strategy/BatchStrategy');
const LoadStrategy = require('./strategy/LoadStrategy');
const LoadInPlaceStrategy = require('./strategy/LoadInPlaceStrategy');
const RequestStrategy = require('./strategy/RequestStrategy');
const RequestPollingStrategy = require('./strategy/RequestPollingStrategy');
const HelpStrategy = require('./strategy/HelpStrategy');

// TODO alow external extension and dynamic loading of strategy modules
class StrategyFactory {
    constructor(client) {
        this.client = client;
    }

    create(task, argv) {
        let strategy = null;
        switch (task) {
        case 'query':
            strategy = new QueryStrategy(this.client, argv);
            break;
        case 'batch':
            strategy = new BatchStrategy(this.client, argv);
            break;
        case 'load':
            strategy = new LoadStrategy(this.client, argv);
            break;
        case 'load-in-place':
            strategy = new LoadInPlaceStrategy(this.client, argv);
            break;
        case 'request':
            strategy = new RequestStrategy(this.client, argv);
            break;
        case 'request-polling':
            strategy = new RequestPollingStrategy(this.client, argv);
            break;

        default:
            strategy = new HelpStrategy(this.client, argv);
            break;
        }
        return strategy;
    }
}

module.exports = StrategyFactory;
