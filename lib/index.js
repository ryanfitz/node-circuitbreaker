'use strict';

const events = require('events');
const CircuitBreaker = require('./circuit-breaker');
const Stats = require('./stats');

const eventEmitterMethods = Object.keys(events.EventEmitter.prototype);

module.exports = function (func, options) {
    const breaker = new CircuitBreaker(func, options);

    const result = function () {
        return breaker.invoke.apply(breaker, arguments);
    };

    // public api methods to expose
    // exposing all event emitter methods
    const methods = [
        'isOpen',
        'isClosed',
        'forceOpen',
        'forceClosed',
        'forceHalfOpen'
    ].concat(eventEmitterMethods);

    methods.forEach((method) => {
        result[method] = function () {
            return breaker[method].apply(breaker, arguments);
        };
    });

    result.stats = new Stats(breaker);

    return result;
};
