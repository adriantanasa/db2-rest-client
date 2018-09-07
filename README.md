# db2-on-cloud-rest

Node.js client for DB2 on Cloud Warehouse REST Apis (previously dashDB).

## Installation

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

## Jobs

TBD

## Integration Testing

Runing test agains real environment:

```
export DB_USERID='bluadmin';export DB_PASSWORD='<password>';export DB_URI='https://<hostname>/dbapi/v3';export DEBUG=db2-on-cloud-rest; npm run integration
```

## References

https://dashdb-txnha-flex-yp-dal09-104.services.dal.bluemix.net/console/api/index.html
