const _ = require('lodash');
const prototype = require('../config/apiPrototypes.json');

class RequestOptionsBuilder {
    constructor(defaultConfig = {}) {
        this.defaults = defaultConfig;
    }

    build(type = 'DEFAULT', extraOptions = {}) {
        let options;
        // fallback to default request options
        let protoOptions = prototype[type] || prototype['DEFAULT'];
        options = _.merge({}, protoOptions, extraOptions);
        // inject custom values
        if (options.uri) { options.uri = this.defaults.uri + options.uri; }

        if (options.body && options.body.hasOwnProperty('userid')) {
            options.body.userid = this.defaults.userid;
            options.body.password = this.defaults.password;
        }

        if (options.auth && options.auth.hasOwnProperty('bearer')) {
            options.auth.bearer = this.getAuthKey();
        }

        return options;
    }

    setAuthKey(key = '') {
        this.defaults.authKey = key;
    }

    getAuthKey() {
        return this.defaults.authKey;
    }
}

module.exports = RequestOptionsBuilder;
