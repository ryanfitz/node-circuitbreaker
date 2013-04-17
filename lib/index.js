'use strict';

var Q = require('q');

var STATES = {
  OPEN : 'OPEN',
  CLOSED: 'CLOSED',
  HALF: 'HALF-OPEN'
};

var CircuitBreaker = module.exports = function (func, options) {
  this.options = options || {};
  this._func = func;
  this.timeout = this.options.timeout || 10000; // default 10 second timeout (ms)
  this.resetTimeout = this.options.resetTimeout || 60000; // default 1 minute reset timeout (ms)
  this.maxFailures = this.options.maxFailures || 5; // default max number of failures to open circuit

  // Initially circuit is always closed
  this.forceClosed();
};

CircuitBreaker.prototype.invoke = function () {
  var self = this;

  if(self.isOpen() || (self.isHalfOpen() && self._halfOpenCallPending)) {
    return self._fastFail();
  } else if(self.isHalfOpen() && !self._halfOpenCallPending) {
    self._halfOpenCallPending = true;
    return self._callFunction.apply(self, arguments).fin(function () {
      self._halfOpenCallPending = false;
    });
  } else {
    return self._callFunction.apply(self, arguments);
  }
};

CircuitBreaker.prototype._fastFail = function () {
  return Q.fcall(function () {
    throw new Error('Circuit Breaker open');
  });
};

CircuitBreaker.prototype._callFunction = function () {
  var self = this;

  var deferred = Q.defer();

  var args = [];
  for(var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  args.push(deferred.makeNodeResolver());

  setTimeout(deferred.reject, self.timeout);

  var promise = deferred.promise;

  promise.then(function () {
    self.handleSuccess();
  }, function(err) {
    self.handleFailure(err);
  });

  self._func.apply(self._func, args);

  return promise;
};

CircuitBreaker.prototype.handleSuccess = function () {
  this.forceClosed();
};

CircuitBreaker.prototype.handleFailure = function () {
  ++this._numFailures;

  if(this.isHalfOpen() || this._numFailures >= this.maxFailures) {
    this.forceOpen();
  }
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
  var self = this;

  if(this.state === STATES.OPEN) {
    return;
  }

  this.state = STATES.OPEN;

  // After reset timeout circuit should enter half open state
  setTimeout(function () {
    self.state = STATES.HALF;
  }, self.resetTimeout);

};

CircuitBreaker.prototype.forceClosed = function () {
  this.state = STATES.CLOSED;
  this._numFailures = 0;
};

CircuitBreaker.prototype.forceHalfOpen = function () {
  this.state = STATES.HALF;
};
