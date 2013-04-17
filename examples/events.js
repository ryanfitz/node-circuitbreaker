'use strict';

var circuitBreaker = require('../index');

var loadDataFromRemoteServer = function (id, callback) {
  if (id < 0) {
    return callback(new Error('error loading data ' + id));
  } else {
    return callback(null, 'data for id ' + id);
  }
};

var breaker = circuitBreaker(loadDataFromRemoteServer, {timeout: 10, maxFailures: 3, resetTimeout: 30});

breaker.on('open', function () {
  console.log('circuit is now open');
});

breaker.on('close', function () {
  console.log('circuit is now closed');
});

breaker.on('halfOpen', function () {
  console.log('circuit is now halfOpen');
});

var noop = function () {};
breaker(23);

breaker(-1).fail(noop);
breaker(-1).fail(noop);
breaker(-1).fail(noop);

setTimeout(function () {
  breaker(32);
}, 35);
