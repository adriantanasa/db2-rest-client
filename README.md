# db2-rest-client

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Coveralls Status][coveralls-image]][coveralls-url]

Node.js client for [IBM Db2 (Warehouse) on Cloud](#references) REST API (previously DashDB).
It is intended to be used for DevOps (administration, monitoring, data load) for DB2 on Cloud service.
The client can be used as part of a Node.js application or as a CLI tool.

The target APIs are covering the following main areas: authentication, database objects, data load, SQL, file storage, monitoring, settings, users administration.

- [Installation & Usage](#installation--usage)
    - [Node.js Application](#nodejs-application)
    - [CLI - CI/Shell script](#cli---cishell-script)
- [Client API](#client-api)
- [CLI API / Jobs](#cli-api--jobs)
- [Starting checklist](#starting-checklist)
- [Integration Testing](#integration-testing)
- [Debugging](#debugging)
- [Contribution](#contribution)
- [References](#references)

## Installation & Usage

### Node.js Application

Installing the client locally and using it in a Node.JS application:

```bash
npm i db2-rest-client --save
```

```javascript
const Db2RestClient = require('db2-rest-client');

// calling it directly in a root script
(async () => {
    try {
        const db2Client = new Db2RestClient({
            credentials: {
                userid: 'userId',
                password: 'password'
            },
            uri: 'https://<db2-on-cloud-hostname>/dbapi/v3'
        });

        // load data from a local file - target table previously created
        const res = await db2Client.load('./path/to/data.csv', 'MY_TABLE', 'MY_SCHEMA');
        // query
        const data = await db2Client.query('SELECT COUNT(*) AS TOTAL FROM MY_SCHEMA.MY_TABLE');
        console.log(data);
    } catch (err) {
        console.err('Client error', err);
    }
})();
```

### CLI - CI/Shell script

Installing and using the module in CLI mode:

```bash
npm i -g db2-rest-client

# shell code start
export DB_USERID='<USERNAME>'
export DB_PASSWORD='<PASSWORD>'
export DB_URI='https://<hostname>/dbapi/v3'
# optional parameters
export DB_POLLING_WAIT=5000
export DB_POLLING_MAX_RETRIES=50
export DEBUG=db2-rest-client:cli
# call a job - load data to a target table
db2-rest-client load --file=sample1.csv --table='MY_TABLE' --schema='MY_SCHEMA'
# shell code end
```

## Client API

Check the /test/integration and the /lib/strategy folders for usage examples.

### construct

Accept an config object as input with the following properties:

- credentials - {userid: '...', password:'...'} as per Db2 on Cloud credentials page

- uri - URI of the DB2 REST api (check the example above for V3)

- pollingWait - Waiting time (ms) between polling requests

- pollingMaxRetries - Number of polling retries before aborting a job

### request 

Base method for performing a request to DB2 Rest API - it performs authorization if necesary.

- type ('DEFAULT') - maps to one of the preefined object in config/apiPrototypes.json

- extraOptions ({}) - overrides the type based request options - check request-promise module for the format.

- authRequired (true) - does request requires an auth key or not

### requestPolling

Base method for the request polling required for some async rest calls as upload progress, batch queries etc. 
It checks the status of a job until the response body matches success or failure object or the polling limit is reached (pollingMaxRetries)

- type ('DEFAULT') - as above

- extraOptions - as above

- success ({status: 'completed'}) - The body match for success - can be also an array

- failed ({status: 'failed'})

- tryCount - used internaly for polling

- pollingMaxRetries (20) - Number of polling retries before aborting the job

- pollingWait - Waiting time in miliseconds between polling requests

### query

Executes an SELECT SQL query and returns up to 100.000 rows as JSON. For all other queries or non-existing table an error is reported.

- sqlQuery - SQL query

### bulkQueries

Executes a comma separated list of SQL queries. All the queries that are not SELECT have also to use this method.

- sqlQueries - SQL command (ex: 'DELETE FROM MY_SCHEMA.MY_TABLE WHERE 1; INSERT INTO MY_SCHEMA.MY_TABLE VALUES (\'1\',\'TEST\');')

### upload

Uploads a local (CSV) file to the DB2 on Cloud server in order to be used later in a load job.

- filePath - path to local .csv file

### load

Loads data into a target table from a local .csv file. It calls the upload method above as part of the process.

- filePath - path to local .csv file

- table - Target table

- schema - Table schema

- isReplace (true) - Data load mode (REPLACE vs INSERT)

- extraOptions ({}) - Override request payload - for example file type, data separator.

## CLI API / Jobs

The module provides a set of predefined jobs that can be executed in an CLI/automation script and can be integrated with a CI runner (Jenkins/Travis).
For the jobs that have an non-debug output (ex: query) can have it redirected to a separate file.

Environment variables - see the [CLI api](#client-api) for values:

- DB_USERID
- DB_PASSWORD
- DB_URI || DB_HOSTNAME
- DB_POLLING_WAIT
- DB_POLLING_MAX_RETRIES

### query

Executes an SQL statement in sync mode and returns up to 100.000 rows of data in JSON format. Only SELECT statements are allowed by
the DB2 endpoint api.

```bash
export DB_USERID='<USERID>';export DB_PASSWORD='<PASSWORD>';export DB_URI='https://<hostname>/dbapi/v3';export DEBUG=db2-rest-client:cli;
# example of output to a file
db2-rest-client query --query="SELECT * FROM MANUAL.TST_SAMPLE" > test.json
```

### batch

Executes a coma separated list of SQL statements.

```bash
db2-rest-client batch --query="INSERT INTO MANUAL.TST_SAMPLE (ID, DESCRIPTION) VALUES ('100', 'test'); SELECT * FROM MANUAL.TST_SAMPLE;" > test.json
```

### load

Loads data from a local .csv file into a target table.

```bash
db2-rest-client load --file=./test/data/sample1.csv --table='TST_SAMPLE' --schema='MANUAL' --type=INSERT
```

Tests performed on a DB2 on Cloud instance (Flex plan - IBM dedicated):

 - file size 70MB / ~ 4 million rows completed in 3 minutes
 - file size 200MB / ~ 7 million rows completed in 7 minutes

### load-in-place

Loads data from a local .csv file in a newly created table (from the target table schema) and then replaces the target with the new table (renaming).

```bash
# default CSV file
db2-rest-client load-in-place --file=./test/data/sample2.csv --table='TST_SAMPLE' --schema='MANUAL'

# customize request - TSV file with header
db2-rest-client load-in-place --file=./test/data/sample3.tsv --table='TST_SAMPLE' --schema='MANUAL' --extra='{"body": { "file_options": {"has_header_row":"yes","column_delimiter":"0x09"}}}'

```

### request

Executes a raw authenticated request using a JSON object as input compatible with request-promise-native.

```bash
# performing a GET request for the users list
db2-rest-client request --options='{"uri": "/users"}'
# returning storage information
db2-rest-client request --options='{"uri": "/monitor/storage"}'
# performing a POST request to create a schema
db2-rest-client request --options='{"uri": "/schemas", method:"POST", "body": {"name":"NEWSCHEMA"}}'
```

### request-polling

Some of the requests (as loading data) require first to do a POST request with the information and then check the progress using the returned ID until a success or failure status is reached.

```bash
# example for checking a load job created in a previous request
db2-rest-client request-polling --options='{"uri": "/load_jobs/1536865382644"}' --success='{"status": {"status": "Success"}}' --failed='{"status": {"status": "Failure"}}'  --pollingMaxRetries=50 --pollingWait=10000
```

_Note:_ The job is using the DB2 _RENAME_ statement so additional actions are needed to re-create the indexes and other constraints.

## Starting checklist

- DB2 on Cloud or DB2 Warehouse on Cloud Service created
- At least one user defined on the service Credentials page - **IBM on Cloud > DB2 Service > Service Credentials** or **Data & Analytics > Db2 Warehouse on Cloud > Service Credentials**
- (Recommended) Repository cloned localy and [integration tests](#integration-testing) executed with success

## Integration Testing

Allows the user to tests the core client methods (executing statements, export data, load data from a .csv source file, upload) against a real DB2 (Warehouse) on Cloud instance.


```bash
# by default uses the user schema (some plans don't allow additional schemas - Entry  plan for Db2 Warehouse on Cloud)
export DB_USERID='<userid>';export DB_PASSWORD='<password>';export DB_URI='https://<hostname>/dbapi/v3'; npm run integration

# testing creation of new schema as well
export DB_USERID='<userid>';export DB_PASSWORD='<password>';export DB_URI='https://<hostname>/dbapi/v3';export DB_NEW_SCHEMA=true; npm run integration
```

## Debugging

```
# all log levels
export DEBUG=db2-rest-client:*
# debug info
export DEBUG=db2-rest-client:info
# cli mode
export DEBUG=db2-rest-client:cli
```

## Contribution

We are welcoming contributors - feel free to report issues, request features and help us improve the tool.
For code contribution please create first a feature request (issue - tagged *enhancement* or *bug*) then a PR request from your forked branch.
Code needs to pass lint and UT automate checks before being reviewed.

## References

* [IBM Db2 Warehouse on Cloud REST API](https://developer.ibm.com/static/site-id/85/api/db2whc-v3/)
* [Db2 on Cloud - IBM Knowledge Center](https://www.ibm.com/support/knowledgecenter/en/SS6NHC/com.ibm.swg.im.dashdb.kc.doc/welcome.html)
* [IBM DB2 Warehouse on Cloud](https://www.ibm.com/cloud/db2-warehouse-on-cloud)
* [IBM DB2 on Cloud](https://www.ibm.com/cloud/db2-on-cloud)
* [ibm_db module](https://www.npmjs.com/package/ibm_db)


[npm-image]: https://img.shields.io/npm/v/db2-rest-client.svg
[npm-url]: https://npmjs.org/package/db2-rest-client
[travis-image]: https://img.shields.io/travis/adriantanasa/db2-rest-client/master.svg
[travis-url]: https://travis-ci.org/adriantanasa/db2-rest-client
[downloads-image]: https://img.shields.io/npm/dm/db2-rest-client.svg
[downloads-url]: https://npmjs.org/package/db2-rest-client
[coveralls-image]: https://coveralls.io/repos/github/adriantanasa/db2-rest-client/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/adriantanasa/db2-rest-client?branch=master
