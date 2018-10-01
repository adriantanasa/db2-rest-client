const debug = require('debug')('db2-rest-client:cli');
const JobStrategy = require('./JobStrategy');
const HttpError = require('../HttpError');
const fs = require('fs');

class LoadInPlaceStrategy extends JobStrategy {

    async execute() {
        await super.execute();
        const {file, table, schema, extra} = this.args;
        const tempTable = `${table}_TEMP`;
        const bkpTable = `${table}_BKP`;

        let extraObj;
        if (extra) extraObj = JSON.parse(extra);

        let data = await this.getClient().query(
            `SELECT COUNT(*) AS TOTAL FROM SYSCAT.TABLES WHERE tabschema = '${schema}' AND tabname = '${table}'
UNION ALL
    SELECT COUNT(*) AS TOTAL FROM SYSCAT.TABLES WHERE tabschema = '${schema}' AND tabname = '${tempTable}'
UNION ALL
    SELECT COUNT(*) AS TOTAL FROM SYSCAT.TABLES WHERE tabschema = '${schema}' AND tabname = '${bkpTable}'`);

        let [isTable, isTempTable, isBkpTable] = data;
        if (isTable['TOTAL'] === '0') {
            throw new HttpError('Target table not found', 400);
        }

        const dropQueries = [];
        if (isTempTable['TOTAL'] !== '0') dropQueries.push(`DROP TABLE ${schema}.${tempTable}`);
        if (isBkpTable['TOTAL'] !== '0') dropQueries.push(`DROP TABLE ${schema}.${bkpTable}`);

        // delete tmp table and recreate if any
        if (dropQueries.length > 0) {
            await this.getClient().bulkQueries(dropQueries.join(';'));
        }
        await this.getClient().bulkQueries(
            `CREATE TABLE ${schema}.${tempTable} LIKE ${schema}.${table} INCLUDING IDENTITY`);
        debug('Temporary table created');

        await this.getClient().load(file, tempTable, schema, true, extraObj);
        debug('Data loaded to temporary table');

        await this.getClient().bulkQueries(
            `RENAME TABLE ${schema}.${table} TO ${bkpTable};
             RENAME TABLE ${schema}.${tempTable} TO ${table};
            `);
    }

    isValid({file, table, schema, extra}) {
        // TODO create a Validator helper
        const isValidTable = table && typeof table === 'string';
        const isValidSchema = schema && typeof schema === 'string';
        const isValidFile = file && typeof file === 'string' && fs.existsSync(file);

        let isValidJSON = true;

        if (extra) {
            try {
                JSON.parse(extra);
            } catch (err) {
                isValidJSON = false;
                debug('Error parsing JSON input for --extra');
            }
        }

        const valid = isValidFile && isValidSchema && isValidTable && isValidJSON;
        if (!valid) debug('Wrong/missing job arguments',
            isValidTable, isValidSchema, isValidFile, isValidJSON);
        return !!valid;
    }
}

module.exports = LoadInPlaceStrategy;
