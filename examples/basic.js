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

breaker(23).then(console.log);

breaker(-1).fail(console.log);
breaker(-1).fail(console.log);
breaker(-1).fail(console.log);

breaker(32).fail(function(err) {
  console.log('failed because breaker is open', err);
});

setTimeout(function () {
  breaker(32).then(function (data) {
    console.log('loaded data because circuit reset after timeout: ', data);
  });
}, 35);
