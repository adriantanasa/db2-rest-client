#!/usr/bin/env node

'use strict';

const util = require('util');
const debug = require('debug')('db2-rest-client:cli');
const argv = require('minimist')(process.argv.slice(2));
const Db2RestClient = require('../lib/Db2RestClient');
const StrategyFactory = require('../lib/StrategyFactory');

/**
 * Entry point for cli jobs
 * export DB_USERID='<userid>';export DB_PASSWORD='<password>'; export DB_URI='https://<hostname>/dbapi/v3'
 * db2-rest-client <job> <arguments>
 */

const {
    DB_PASSWORD: password,
    DB_USERID: userId,
    DB_URI: uri,
    DB_HOSTNAME: hostname,
    DB_POLLING_WAIT: pollingWait,
    DB_POLLING_MAX_RETRIES: pollingMaxRetries
} = process.env;

if (!password || !userId || !(uri || hostname)) {
    debug('Required credentials missing!');
    process.exit(1);
}

const config = {
    credentials: {
        userid: userId,
        password: password
    },
    uri: uri || `https://${hostname}>/dbapi/v3`,
    pollingWait: pollingWait,
    pollingMaxRetries: pollingMaxRetries
};

let task = argv['_'].length > 0 ? argv['_'][0] : 'help';

// async call
(async () => {
    debug('Job started for %s', task);
    try {
        const client = new Db2RestClient(config);
        const factory = new StrategyFactory(client);
        let strategy = factory.create(task, argv);

        if (strategy) {
            let data = await strategy.execute();
            // some job have an JSON output that can be piped
            if (data !== undefined) {
                // eslint-disable-next-line no-console
                console.log(strategy.isJSONOutput()
                    ? util.inspect(data, {showHidden: false, depth: null}) : data);
            }
        }
    } catch (e) {
        // Deal with the fact the chain failed
        debug('Error: %s', e, e.statusCode || '');
        process.exit(0);
    }

    debug('Done');
    process.exit(0);
})();
