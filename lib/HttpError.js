class HttpError extends Error {
    constructor(error, statusCode = 500) {
        super(error.message || error);
        this.statusCode = statusCode;
    }
}

module.exports = HttpError;
