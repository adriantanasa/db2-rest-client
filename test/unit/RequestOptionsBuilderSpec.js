const RequestOptionsBuilder = require('../../lib/RequestOptionsBuilder');
const expect = require('chai').expect;

describe('Testsuite RequestOptionsBuilder', () => {

    // let error;
    let goodConfig = {
        authKey: 'test',
        uri: 'https://hostname',
        userid: 'user',
        password: 'pass',
    };

    it('Testcase - construct', () => {
        let builder = new RequestOptionsBuilder(goodConfig);
        expect(builder.defaults).to.equal(goodConfig);
    });

    it('Testcase - build - default params', () => {
        let builder = new RequestOptionsBuilder(goodConfig);
        let options = builder.build();
        expect(options).to.deep.equal({
            'method': 'GET',
            'auth': {'bearer': 'test'},
            'json': true
        });
    });

    it('Testcase - build - URI', () => {
        let builder = new RequestOptionsBuilder(goodConfig);
        let options = builder.build('DEFAULT', {
            uri: '/api'
        });
        expect(options.uri).to.equal('https://hostname/api');
    });

    it('Testcase - build - extra parameters merged', () => {
        let builder = new RequestOptionsBuilder(goodConfig);
        let {body: {command, separator, limit}} = builder.build('SQL_JOBS', {
            body: {
                command: 'SELECT 1 AS TEST',
                separator: '#',
            }
        });

        expect(command).to.equal('SELECT 1 AS TEST');
        expect(separator).to.equal('#');
        expect(limit).to.equal(1000);
    });

    it('Testcase - build - user/password replacement', () => {
        let builder = new RequestOptionsBuilder(goodConfig);
        let {body: {userid, password}} = builder.build('AUTH');
        expect(userid).to.equal('user');
        expect(password).to.equal('pass');
    });

    it('Testcase - build - user/password replacement', () => {
        let builder = new RequestOptionsBuilder(goodConfig);
        builder.setAuthKey('newkey');
        expect(builder.getAuthKey()).to.equal('newkey');
    });

});
