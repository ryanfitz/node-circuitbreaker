'use strict';

const circuitBreaker = require('../index');

const loadDataFromRemoteServer = function (id, callback) {
    if (id < 0) {
        return callback(new Error(`error loading data ${id}`));
    }

    return callback(null, `data for id ${id}`);
};

const breaker = circuitBreaker(loadDataFromRemoteServer, {
    timeout: 10,
    maxFailures: 3,
    resetTimeout: 30
});

breaker.on('open', () => {
    console.log('circuit is now open');
});

breaker.on('close', () => {
    console.log('circuit is now closed');
});

breaker.on('halfOpen', () => {
    console.log('circuit is now halfOpen');
});

const noop = function () {};

breaker(23);

breaker(-1).fail(noop);
breaker(-1).fail(noop);
breaker(-1).fail(noop);

setTimeout(() => {
    breaker(32);
}, 35);
