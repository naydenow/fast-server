const moment = require('moment');

const ERROR_EXCEPTION_ALIAS = {
    'TokenExpiredError': 'SessionExpiredError'
};

const ERROR_NAME_ALIAS = {
    'Unauthorized': 'Forbidden'
};

/* eslint-disable camelcase */
class CustomError extends Error {
    constructor(details = {}, message) {
        super();

        this.name = 'CustomError';
        this.message = message;
        this.details = details;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error()).stack;
        }
    }

    toJSON() {
        return {
            timestamp: moment.utc().format(),
            exception: this.name,
            message: this.message,
            details: this.details,
            http_error: httpErrors.get(this.statusCode),
            status_code: this.statusCode
        };
    }
}

class ErrorWrapper extends Error {
    constructor({ timestamp, details, exception, name, message, status_code, http_error }) {
        super();

        this.timestamp = timestamp;
        this.details = details;
        this.exception = ERROR_EXCEPTION_ALIAS[exception] || exception;
        this.name = ERROR_NAME_ALIAS[name] || name || http_error || exception;
        this.message = message;
        this.status_code = status_code;
        this.http_error = http_error;
    }

    toJSON() {
        return {
            name: this.name,
            timestamp: this.timestamp,
            exception: this.exception,
            message: this.message,
            details: this.details,
            http_error: this.http_error,
            status_code: this.status_code
        };
    }
}

class ServiceUnavailable extends CustomError {
    constructor(details, message = 'Internal Server Error') {
        super(details, message);

        this.name = 'ServiceUnavailableError';
        this.statusCode = 503;
    }
}

class Conflict extends CustomError {
    constructor(details, message = 'Entity conflict') {
        super(details, message);

        this.name = 'ConflictError';
        this.statusCode = 409;
    }
}

class InsufficientFunds extends CustomError {
    constructor(details, message = 'Insufficient funds') {
        super(details, message);

        this.name = 'InsufficientFundsError';
        this.statusCode = 402;
    }
}

class NotFound extends CustomError {
    constructor(details, message = 'The server could not find what was requested') {
        super(details, message);

        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class PermissionDenied extends CustomError {
    constructor(details, message = 'You have no permission to perform this action') {
        super(details, message);

        this.name = 'PermissionDeniedError';
        this.statusCode = 403;
    }
}

class SessionExpired extends CustomError {
    constructor(details = {}, message = 'Session expired') {
        super(details, message);

        this.name = 'SessionExpiredError';
        this.statusCode = 440;
    }
}

class Validation extends CustomError {
    constructor(details, message = 'Validation failed') {
        super(details, message);

        this.name = 'ValidationError';
        this.statusCode = 422;
    }
}

class Delivery extends CustomError {
    constructor(details, message = 'Message delivery failed') {
        super(details, message);

        this.name = 'DeliveryError';
        this.statusCode = 500;
    }
}

class Queue extends CustomError {
    constructor(details, message = 'Message queueing failed') {
        super(details, message);

        this.name = 'QueueError';
        this.statusCode = 500;
    }
}

class Seek extends CustomError {
    constructor(details, message = 'Seek failed') {
        super(details, message);

        this.name = 'SeekError';
        this.statusCode = 500;
    }
}

const setGlobalExceptions = () => {
    global.Conflict = Conflict;
    global.InsufficientFunds = InsufficientFunds;
    global.NotFound = NotFound;
    global.PermissionDenied = PermissionDenied;
    global.Validation = Validation;
    global.Delivery = Delivery;
    global.Seek = Seek;
    global.Queue = Queue;
    global.ErrorWrapper = ErrorWrapper;
    global.SessionExpired = SessionExpired;
    global.ServiceUnavailable = ServiceUnavailable;
};

setGlobalExceptions();


const httpErrors = new Map([
    [100, 'Continue'],
    [101, 'Switching Protocols'],
    [102, 'Processing'],
    [200, 'OK'],
    [201, 'Created'],
    [202, 'Accepted'],
    [203, 'Non-Authoritative Information'],
    [204, 'No Content'],
    [205, 'Reset Content'],
    [206, 'Partial Content'],
    [207, 'Multi-Status'],
    [300, 'Multiple Choices'],
    [301, 'Moved Permanently'],
    [302, 'Moved Temporarily'],
    [303, 'See Other'],
    [304, 'Not Modified'],
    [305, 'Use Proxy'],
    [307, 'Temporary Redirect'],
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [402, 'Payment Required'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [405, 'Method Not Allowed'],
    [406, 'Not Acceptable'],
    [407, 'Proxy Authentication Required'],
    [408, 'Request Time-out'],
    [409, 'Conflict'],
    [410, 'Gone'],
    [411, 'Length Required'],
    [412, 'Precondition Failed'],
    [413, 'Request Entity Too Large'],
    [414, 'Request-URI Too Large'],
    [415, 'Unsupported Media Type'],
    [416, 'Requested Range Not Satisfiable'],
    [417, 'Expectation Failed'],
    [418, 'I\'m a teapot'],
    [422, 'Unprocessable Entity'],
    [423, 'Locked'],
    [424, 'Failed Dependency'],
    [425, 'Unordered Collection'],
    [426, 'Upgrade Required'],
    [428, 'Precondition Required'],
    [429, 'Too Many Requests'],
    [431, 'Request Header Fields Too Large'],
    [451, 'Unavailable For Legal Reasons'],
    [500, 'Internal Server Error'],
    [501, 'Not Implemented'],
    [502, 'Bad Gateway'],
    [503, 'Service Unavailable'],
    [504, 'Gateway Time-out'],
    [505, 'HTTP Version Not Supported'],
    [506, 'Variant Also Negotiates'],
    [507, 'Insufficient Storage'],
    [509, 'Bandwidth Limit Exceeded'],
    [510, 'Not Extended'],
    [511, 'Network Authentication Required']
]);

module.exports = {
    CustomError,
    Conflict,
    InsufficientFunds,
    NotFound,
    PermissionDenied,
    Validation,
    Delivery,
    Queue,
    Seek,
    setGlobalExceptions,
    httpErrors,
    ErrorWrapper,
    SessionExpired
};
