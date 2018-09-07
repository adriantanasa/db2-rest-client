const fs = require('fs');
const path = require('path');
const rp = require('request-promise-native');
const _ = require('lodash');
const csv = require('csvtojson');
const debug = require('debug')('db2-on-cloud-rest');

const RequestOptionsBuilder = require('./RequestOptionsBuilder');
const HttpError = require('./HttpError');
const timeOut = require('./timeOut');

const REQ_TYPE_DEFAULT = 'DEFAULT';
const REQ_TYPE_AUTH = 'AUTH';
const REQ_TYPE_SQL_JOBS = 'SQL_JOBS';
const REQ_TYPE_SQL_QUERY_EXPORT = 'SQL_QUERY_EXPORT';

class Db2RestClient {

    constructor(config = {}) {
        const {credentials, uri, poolingTimeout, poolingMaxRetries} = config;
        this.credentials = credentials;
        this.uri = uri;
        this.authKey = null;
        this.optionsBuilder = null;
        this.poolingTimeout = poolingTimeout || 3000;
        this.poolingMaxRetries = poolingMaxRetries || 20;
    }

    async request(type = REQ_TYPE_DEFAULT, extraOptions = {}, authRequired = true) {
        debug('[request] call', ...arguments);
        if (authRequired && !this.authKey) {
            await this.getOauthKey();
        }

        let options = this.getOptions(type, extraOptions);
        let data = null;
        try {
            data = await rp(options);
        } catch (err) {
            // retry refresh and retry when expired
            if (err.statusCode && err.statusCode == 401) {
                debug(err, '[request] Error for call with cached auth key. Updating token ...');
                await this.getOauthKey(true);
                options = this.getOptions(type, extraOptions);
                data = await rp(options);
            } else {
                throw err;
            }
        }
        return data;
    }

    /**
     * Check results until output matches succes or failed status or execution limits reached
     * TODO move defaults for success / failures as statics to optionsBuilder
     */
    async requestPolling(type = REQ_TYPE_DEFAULT, extraOptions = {}, success = {status: 'completed'},
        failed = {status: 'failed'}, tryCount = 0, poolingMaxRetries = this.poolingMaxRetries,
        poolingTimeout = this.poolingTimeout) {
        debug('[requestPolling] call', ...arguments);
        let result = await this.request(type, extraOptions);
        debug('[requestPolling] result: ', result);
        // support more success/failed values - see load
        const succesValues = Array.isArray(success) ? success : [success];
        const failedValues = Array.isArray(failed) ? failed : [failed];

        if (succesValues.some((status) => {
            return _.isMatch(result, status);
        })) return result;

        if (failedValues.some((status) => (_.isMatch(result, status)))) throw new HttpError('Query failed');

        // call another
        if (tryCount < poolingMaxRetries) {
            debug('[requestPolling] plan next check in:', this.poolingTimeout);
            await timeOut(poolingTimeout);
            return await this.requestPolling(type, extraOptions, success, failed, tryCount + 1);
        } else {
            debug('[requestPolling] reached time limit', result);
            throw new Error('Failed to complete job in limits');
        }
    }

    async getOauthKey(refresh = false) {
        debug('[getOauthKey] call', ...arguments);
        if (!refresh && this.authKey) return this.authKey;

        const {userid, password} = this.credentials;
        if (!userid || !password) throw new Error('Credentials required!');
        const options = this.getOptions(REQ_TYPE_AUTH);

        let response = null;
        try {
            response = await rp(options);
            this.authKey = response.token || '';
        } catch (err) {
            this.authKey = '';
            throw err;
        }
        return this.authKey;
    }

    getOptions(type = REQ_TYPE_DEFAULT, extra = {}) {
        debug('[getOptions] call', ...arguments);
        const {uri, authKey} = this;
        const {userid, password} = this.credentials;
        // update auth key
        if (this.optionsBuilder) {
            this.optionsBuilder.setAuthKey(authKey);
        } else {
            this.optionsBuilder = new RequestOptionsBuilder({uri, authKey, userid, password});
        }
        return this.optionsBuilder.build(type, extra);
    }

    async bulkQueries(sqlQueries = '') {
        debug('[bulkQueries] call', ...arguments);
        let data = await this.request(REQ_TYPE_SQL_JOBS, {
            body: {
                'commands': sqlQueries
            }
        });
        return await this.requestPolling(REQ_TYPE_DEFAULT, {uri: '/sql_jobs/' + data['id']});
    }

    async query(sqlQuery) {
        debug('[query] call', ...arguments);
        const data = await this.request(REQ_TYPE_SQL_QUERY_EXPORT, {
            body: {
                'command': sqlQuery
            }
        });
        return await csv().fromString(data);
    }

    async upload(filePath) {
        debug('[upload] call', ...arguments);
        if (!fs.existsSync(filePath)) throw new HttpError('Invalid file path', 404);
        const extraOptions = {
            formData: {
                custom_file: {
                    value: fs.createReadStream(filePath),
                    options: {
                        filename: filePath,
                        contentType: 'text/csv'
                    }
                }
            }
        };

        return await this.request('UPLOAD', extraOptions);
    }

    async loadFromServer(filename, table, schema, isReplace = true, extraOptions = {}) {
        debug('[upload] loadJob', ...arguments);
        // TODO move it as a static method to optionsBuilder
        let methodOptions = {
            'body': {
                'schema': schema,
                'table': table,
                'server_source': {
                    'file_path': `load/${filename}`
                },
            }
        };

        if (isReplace) methodOptions.body.load_action = 'REPLACE';

        const data = await this.request('LOAD', _.merge({}, extraOptions, methodOptions));
        const succesValue = [
            {status: {status: 'Success with errors/warnings'}},
            {status: {status: 'Success'}}
        ];
        const failureValue = [{status: {status: 'Failure'}}];
        return await this.requestPolling(REQ_TYPE_DEFAULT, {uri: '/load_jobs/' + data['id']},
            succesValue, failureValue);
    }

    async load(filePath, table, schema, isReplace = true, extraOptions = {}) {
        debug('[upload] load', ...arguments);
        await this.upload(filePath);
        return this.loadFromServer(path.basename(filePath), table, schema, isReplace, extraOptions);
    }

}

module.exports = Db2RestClient;
