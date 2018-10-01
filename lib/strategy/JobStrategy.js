const debug = require('debug')('db2-rest-client:notice');

class JobStrategy {
    constructor(client, args) {
        this.args = args;
        this.client = client;
    }

    async execute() {
        debug(this.args);
        if (!this.isValid(this.args)) throw new Error('Missing required arguments');
        return;
    }

    isValid(args) {
        return !!args;
    }

    getClient() {
        return this.client;
    }

    isJSONOutput() {
        return true;
    }
}

module.exports = JobStrategy;
