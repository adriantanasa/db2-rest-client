const debug = require('debug')('db2-rest-client:cli');
const JobStrategy = require('./JobStrategy');
const fs = require('fs');

class LoadStrategy extends JobStrategy {

    async execute() {
        await super.execute();
        const {file, table, schema, type, extra} = this.args;
        return await this.getClient().load(file, table, schema, !!(type === 'REPLACE'), extra);
    }

    isValid({file, table, schema, type}) {
        const isValidTable = table && typeof table === 'string';
        const isValidSchema = schema && typeof schema === 'string';
        const isValidType = !type || type && typeof type === 'string';
        const isValidFile = file && typeof file === 'string' && fs.existsSync(file);

        const valid = isValidFile && isValidSchema && isValidTable && isValidType;
        if (!valid) debug('Wrong/missing job arguments');
        return valid;
    }
}

module.exports = LoadStrategy;
