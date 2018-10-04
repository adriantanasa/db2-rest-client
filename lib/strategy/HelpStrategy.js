const JobStrategy = require('./JobStrategy');

class HelpStrategy extends JobStrategy {

    async execute() {
        await super.execute();
        return `
NAME:
    db2-rest-client

SYNOPSIS
    db2-rest-client [query|batch|load|load-in-place] <argument-list>

DESCRIPTION

    Executes a cli job against IBM Db2 Warehouse on Cloud REST API

    query
        Executes an sql export query and outputs data as JSON up to a limit of 100.000 rows. Supports only SELECT.

        --query     - SQL query (SELECT)
        
    batch
        Executes a comma (,) separated list of queries. To be used for any queries that are not SELECT(s)

        --query     - SQL queries comma separated
    
    load
        Attempts to load a local csv file into a target DB2 table

        --file      - path to local .csv file
        --table     - table name
        --schema    - schema name
        --type      - REPLACE || INSERT (optional)
        --extra     - JSON encoded object to override default values (optional)
    
    load-in-place
        Loads data from a local file in a new table created from the target, then replaces the target with the new 
        table (renaming).

        --file      - path to local .csv file
        --table     - table name
        --schema    - schema name
        --extra     - JSON encoded object to override default values (optional)

    request
        Executes a raw authenticated request using a JSON object as input compatible with request-promise-native.

        --options    - JSON encoded object - default method GET
                     EX:
                     --options='{"uri": "/users"}
                     --options='{"uri": "/schemas", method:"POST", "body": {"name":"NEWSCHEMA"}}'
    request-polling
        Some of the requests (as loading data) require first to do a POST request with the information and then
        checking the progress using the returned ID repeateadly until a success or failure status is reached.

        --options    - JSON encoded object - default method GET
                     EX:
                       --options='{"uri": "/users"}
                       --options='{"uri": "/schemas", method:"POST", "body": {"name":"NEWSCHEMA"}}'
        --success    - JSON encoded object
        --failed     - JSON encoded object
        --pollingMaxRetries  - Number of retries before aborting
        --pollingWait=10000  - Number of miliseconds between polling requests
    `;
    }

    isValid() {
        return true;
    }

    isJSONOutput() {
        return false;
    }
}

module.exports = HelpStrategy;
