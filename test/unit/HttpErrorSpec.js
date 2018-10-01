const HttpError = require('../../lib/HttpError');
const expect = require('chai').expect;

describe('Testsuite HttpError', () => {

    it('Testcase - construct = defaults', () => {
        let error = new HttpError('Test message');
        expect(error.statusCode).to.equal(500);
        expect(error.message).to.equal('Test message');
    });

    it('Testcase - construct', () => {
        let error = new HttpError(new Error('Not found.'), 404);
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.equal('Not found.');
    });

});
