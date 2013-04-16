var Q = require('q');

var CircuitBreaker = function (func, options) {
  this.options = options || {};
  this.options.timeout = this.options.timeout || 10000; // default 10 second timeout (ms)
  this.options.resetTimeout = this.options.resetTimeout || 60000; // default 1 minute reset timeout (ms)
};

CircuitBreaker.prototype.invoke = function () {
  return Q.fcall(function () {
    throw new Error("Can't do it");
  });
};

module.exports = function(func, options) {
  var breaker = new CircuitBreaker(func, options);

  return function () {
    return breaker.invoke.apply(breaker, arguments);
  };

};
