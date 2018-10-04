const debug = require('debug')('db2-rest-client:cli');
const JobStrategy = require('./JobStrategy');

class RequestPollingStrategy extends JobStrategy {

    async execute() {
        await super.execute();
        const {options, success, failed, pollingMaxRetries, pollingWait} = this.args;
        return await this.getClient().requestPolling(
            undefined,
            JSON.parse(options),
            success === undefined ? success : JSON.parse(success),
            failed === undefined ? failed : JSON.parse(failed),
            undefined,
            pollingMaxRetries,
            pollingWait);
    }

    isValid({options, success, failed, pollingMaxRetries, pollingWait}) {
        let valid = false;
        try {
            JSON.parse(options);
            if (success) JSON.parse(success);
            if (failed) JSON.parse(failed);
            valid = true;
        } catch (err) {
            debug('Error parsing JSON input for one of json entries (options/success/failed)');
        }

        if (pollingWait) valid = valid && isFinite(pollingWait);
        if (pollingMaxRetries) valid = valid && isFinite(pollingMaxRetries);

        if (!valid) debug('Wrong/missing job arguments');
        return valid;
    }
}

module.exports = RequestPollingStrategy;
