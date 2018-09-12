# db2-on-cloud-rest

Node.js client for IBM Db2 Warehouse on Cloud REST API (previously dashDB).
It is intended to be used for DevOps (administration, monitoring, data load) for DB2 on Cloud service.

The target APIs are covering the following main areas:

* Authentication
* Database Objects
* Data load
* SQL
* File Storage
* Monitoring
* Settings
* Users

## Installation

Installing the client locally and using it in a Node.JS application:

```
npm i db2-on-cloud-rest --save
```

## Usage

```javascript
const DB2RestClient = require('db2-on-cloud-rest');

try {
    const db2Client = new DB2RestClient({
        credentials: {
            userid: 'userId',
            password: 'password'
        },
        uri: 'https://<db2-on-cloud-hostname>/dbapi/v3'
    });

    // load data from a local file - request pooling
    const res = await db2Client.upload('./path/to/data.csv');
    // query 
    const data = await db2Client.query('SELECT ID, NAME FROM MYSCHEMA.MYTABLE_NAME');
    console.log(data);
} catch (err) {
    // debug code
}

```

## Methods

TBD

Check the /test/integration folder for examples of usage.

## Jobs

TBD

## Integration Testing

Running integration tests against your DB2 on Cloud instance - the user needs access to create tables, execute queries, load data. The credentials can be found on the **IBM on Cloud > DB2 Service > Credentials** page. 

```
export DB_USERID='<userid>';export DB_PASSWORD='<password>';export DB_URI='https://<hostname>/dbapi/v3'; npm run integration
```

## Debugging

```
# all log levels
export DEBUG=db2-on-cloud-rest
# just info
export DEBUG=db2-on-cloud-rest:info
# all
export DEBUG=db2-on-cloud-rest:*
```

## References

* [IBM Db2 Warehouse on Cloud REST API](https://developer.ibm.com/static/site-id/85/api/db2whc-v3/)
* [IBM DB2 on Cloud](https://www.ibm.com/cloud/db2-on-cloud)
* [ibm_db module](https://www.npmjs.com/package/ibm_db)
