var util = require("util"),
    events = require('events'),
    CircuitBreaker = require('./lib');

var eventEmitterMethods = Object.keys(events.EventEmitter.prototype);

module.exports = function(func, options) {
  var breaker = new CircuitBreaker(func, options);

  var result = function () {
    return breaker.invoke.apply(breaker, arguments);
  };

  // public api methods to expose
  // exposing all event emitter methods
  var methods = [
    'isOpen',
    'isClosed',
    'forceOpen',
    'forceClosed',
    'forceHalfOpen'
  ].concat(eventEmitterMethods);

  methods.forEach(function (method) {
    result[method] = function () {
      return breaker[method].apply(breaker, arguments);
    };
  });

  return result;
};
