'use strict';

const Q = require('q');
const util = require('util');
const events = require('events');

const STATES = {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    HALF: 'HALF-OPEN'
};

const CircuitBreaker = function (func, options) {
    events.EventEmitter.call(this);

    this.options = options || {};
    this.func = func;
    this.timeout = this.options.timeout || process.env.BREAKER_TIMEOUT || 20000; // default 20 second timeout (ms)
    this.resetTimeout = this.options.resetTimeout || process.env.BREAKER_RESET_TIMEOUT || 5000; // default 5 seconds reset timeout (ms)
    this.maxFailures = this.options.maxFailures || process.env.BREAKER_MAX_FAILURES || 10; // default max number of failures to open circuit
    this.errorFn = this.options.errorFn || function () { return true; }; // optional function to break based on custom conditions for error object

    // Initially circuit is always closed
    this.forceClosed();
};

util.inherits(CircuitBreaker, events.EventEmitter);

CircuitBreaker.prototype.invoke = function () {
    const self = this;

    this.emit('request');

    if (self.isOpen() || (self.isHalfOpen() && self.halfOpenCallPending)) {
        return self.fastFail();
    } else if (self.isHalfOpen() && !self.halfOpenCallPending) {
        self.halfOpenCallPending = true;

        return self.callFunction.apply(self, arguments).fin(() => {
            self.halfOpenCallPending = false;
        });
    }

    return self.callFunction.apply(self, arguments);
};

CircuitBreaker.prototype.fastFail = function () {
    const self = this;

    return Q.fcall(() => {
        const err = new Error('CircuitBreaker open');

        self.emit('rejected', err);
        throw err;
    });
};

CircuitBreaker.prototype.callFunction = function () {
    const self = this;
    const deferred = Q.defer();
    const args = Array.prototype.slice.call(arguments);
    const startTime = new Date();
    const timeoutID = setTimeout(this.handleTimeout.bind(this), self.timeout, deferred, startTime);

    args.push(self.callbackHandler(deferred, timeoutID, startTime));

    self.func.apply(self.func, args);

    return deferred.promise;
};

CircuitBreaker.prototype.handleTimeout = function (deferred, startTime) {
    const err = new Error('CircuitBreaker timeout');

    this.handleFailure(err);
    deferred.reject(err);

    this.emit('timeout', (new Date() - startTime));
};

CircuitBreaker.prototype.callbackHandler = function (deferred, timeoutID, startTime) {
    const self = this;

    return function (err, result) {
        clearTimeout(timeoutID);

        if (!deferred.promise.isPending()) {
            return;
        }

        self.emit('latency', (new Date() - startTime));

        if (err) {
            if (self.errorFn(err)) {
                self.handleFailure(err);
            }
            deferred.reject(err);
        } else {
            self.handleSuccess();
            deferred.resolve(result);
        }
    };
};

CircuitBreaker.prototype.handleSuccess = function () {
    this.forceClosed();

    this.emit('success');
};

CircuitBreaker.prototype.handleFailure = function (err) {
    this.numFailures += 1;

    if (this.isHalfOpen() || this.numFailures >= this.maxFailures) {
        this.forceOpen();
    }

    this.emit('failure', err);
};

CircuitBreaker.prototype.isOpen = function () {
    return this.state === STATES.OPEN;
};

CircuitBreaker.prototype.isHalfOpen = function () {
    return this.state === STATES.HALF;
};

CircuitBreaker.prototype.isClosed = function () {
    return this.state === STATES.CLOSED;
};

CircuitBreaker.prototype.forceOpen = function () {
    const self = this;

    if (this.state === STATES.OPEN) {
        return;
    }

    this.state = STATES.OPEN;

    // After reset timeout circuit should enter half open state
    setTimeout(() => {
        self.forceHalfOpen();
    }, self.resetTimeout);

    self.emit('open');
};

CircuitBreaker.prototype.forceClosed = function () {
    this.numFailures = 0;

    if (this.state === STATES.CLOSED) {
        return;
    }

    this.state = STATES.CLOSED;
    this.emit('close');
};

CircuitBreaker.prototype.forceHalfOpen = function () {
    if (this.state === STATES.HALF) {
        return;
    }

    this.state = STATES.HALF;

    this.emit('halfOpen');
};

module.exports = CircuitBreaker;
