var util = require("util"),
    CircuitBreaker = require('./lib');

module.exports = function(func, options) {
  var breaker = new CircuitBreaker(func, options);

  var result = function () {
    return breaker.invoke.apply(breaker, arguments);
  };

  // public api methods to expose
  var methods = [
    'isOpen',
  ];

  methods.forEach(function (method) {
    result[method] = function () {
      return breaker[method].apply(breaker, arguments);
    };
  });

  return result;
};
