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

breaker(23).then(console.log);

breaker(-1).fail(console.log);
breaker(-1).fail(console.log);
breaker(-1).fail(console.log);

breaker(32).fail((err) => {
    console.log('failed because breaker is open', err);
});

setTimeout(() => {
    breaker(32).then((data) => {
        console.log('loaded data because circuit reset after timeout: ', data);
    });
}, 35);
