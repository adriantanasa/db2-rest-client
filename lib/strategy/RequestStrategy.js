const debug = require('debug')('db2-rest-client:cli');
const JobStrategy = require('./JobStrategy');

class RequestStrategy extends JobStrategy {

    async execute() {
        await super.execute();
        const {options} = this.args;
        return await this.getClient().request(undefined, JSON.parse(options));
    }

    isValid({options}) {
        let valid = false;
        try {
            JSON.parse(options);
            valid = true;
        } catch (err) {
            debug('Error parsing JSON input for --options');
        }

        if (!valid) debug('Wrong/missing job arguments');
        return valid;
    }
}

module.exports = RequestStrategy;
