'use strict';

const circuitBreaker = require('../index');

const loadDataFromRemoteServer = function (id, callback) {
    setTimeout(() => {
        if (id < 0) {
            return callback(new Error(`error loading data ${id}`));
        }

        return callback(null, `data for id ${id}`);
    }, Math.abs(id));
};

const breaker = circuitBreaker(loadDataFromRemoteServer, {
    timeout: 30,
    maxFailures: 3,
    resetTimeout: 30
});

const printStats = function () {
    console.log('======= Current Circuit Breaker Stats ========');
    console.log('Total Requests - ', breaker.stats.totalRequests);
    console.log('Total Timeouts - ', breaker.stats.timeouts);
    console.log('Total Successful Responses - ', breaker.stats.successfulResponses);
    console.log('Total Failed Responses - ', breaker.stats.failedResponses);
    console.log('Current Concurrent Requests  - ', breaker.stats.concurrentRequests());
    console.log('Average response time  - ', breaker.stats.averageResponseTime());
    console.log('==============================================\n');
};

const noop = function () {};

breaker(5);

breaker(-1).fail(noop);
breaker(-5).fail(noop);
breaker(10);
breaker(35).fail(noop);
breaker(-10).fail(noop);
breaker(31).fail(noop);

breaker(25).then(printStats);

setTimeout(printStats, 31);
