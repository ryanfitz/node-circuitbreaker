'use strict';

var Q = require('q'),
    util = require('util'),
    events = require('events');

var STATES = {
  OPEN : 'OPEN',
  CLOSED: 'CLOSED',
  HALF: 'HALF-OPEN'
};

var CircuitBreaker = module.exports = function (func, options) {
  events.EventEmitter.call(this);

  this.options = options || {};
  this._func = func;
  this.timeout = this.options.timeout || 10000; // default 10 second timeout (ms)
  this.resetTimeout = this.options.resetTimeout || 60000; // default 1 minute reset timeout (ms)
  this.maxFailures = this.options.maxFailures || 5; // default max number of failures to open circuit

  // Initially circuit is always closed
  this.forceClosed();
};

util.inherits(CircuitBreaker, events.EventEmitter);

CircuitBreaker.prototype.invoke = function () {
  var self = this;

  this.emit('request');

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
  var self = this;
  return Q.fcall(function () {
    var err = new Error('CircuitBreaker open');
    self.emit('rejected', err);
    throw err;
  });
};

CircuitBreaker.prototype._callFunction = function () {
  var self = this;

  var deferred = Q.defer();

  var args = Array.prototype.slice.call(arguments);

  var startTime = new Date();

  var timeoutID = setTimeout(this._handleTimeout.bind(this), self.timeout, deferred, startTime);

  args.push(self._callbackHandler(deferred, timeoutID, startTime));

  self._func.apply(self._func, args);

  return deferred.promise;
};

CircuitBreaker.prototype._handleTimeout = function(deferred, startTime) {
  var err = new Error('CircuitBreaker timeout');
  this.handleFailure(err);
  deferred.reject(err);

  this.emit('timeout', (new Date() - startTime));
};

CircuitBreaker.prototype._callbackHandler = function(deferred, timeoutID, startTime) {
  var self = this;

  return function(err, result) {
    clearTimeout(timeoutID);

    if(!deferred.promise.isPending()) {
      return;
    }

    self.emit('latency', (new Date() - startTime) );

    if(err) {
      self.handleFailure(err);
      deferred.reject(err);
    } else {
      self.handleSuccess();
      deferred.resolve(result);
    }
  };

};

CircuitBreaker.prototype.handleSuccess = function () {
  this.forceClosed();

  this.emit('success');
};

CircuitBreaker.prototype.handleFailure = function (err) {
  ++this._numFailures;

  if(this.isHalfOpen() || this._numFailures >= this.maxFailures) {
    this.forceOpen();
  }

  this.emit('failure', err);
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
    self.forceHalfOpen();
  }, self.resetTimeout);

  self.emit('open');
};

CircuitBreaker.prototype.forceClosed = function () {
  this._numFailures = 0;

  if(this.state === STATES.CLOSED) {
    return;
  }

  this.state = STATES.CLOSED;
  this.emit('close');
};

CircuitBreaker.prototype.forceHalfOpen = function () {
  if(this.state === STATES.HALF) {
    return;
  }

  this.state = STATES.HALF;

  this.emit('halfOpen');
};
