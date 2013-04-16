'use strict';

var Q = require('q');

var STATES = {
  OPEN : 'OPEN',
  CLOSED: 'CLOSED',
  HALF: 'HALF-OPEN'
};

var CircuitBreaker = module.exports = function (func, options) {
  this.options = options || {};
  this.timeout = this.options.timeout || 10000; // default 10 second timeout (ms)
  this.resetTimeout = this.options.resetTimeout || 60000; // default 1 minute reset timeout (ms)

  // Initially circuit is always open
  this.forceOpen();
};

CircuitBreaker.prototype.invoke = function () {
  return Q.fcall(function () {
    throw new Error('Cant do it');
  });
};

CircuitBreaker.prototype.isOpen = function () {
  return this.state === STATES.OPEN;
};

CircuitBreaker.prototype.forceOpen = function () {
  this.state = STATES.OPEN;
};

CircuitBreaker.prototype.forceClosed = function () {
  var self = this;

  this.state = STATES.CLOSED;

  // After reset timeout circuit should enter half open state
  setTimeout(function () {
    self.state = STATES.HALF;
  }, self.resetTimeout);
};
