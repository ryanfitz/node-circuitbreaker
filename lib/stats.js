'use strict';

var Stats = module.exports = function(circuitbreaker) {
  this.breaker = circuitbreaker;

  this.timeouts = 0;
  this.successfulResponses = 0;
  this.failedResponses = 0;
  this.totalRequests = 0;
  this.totalLatency = 0;

  this.breaker.on('timeout', this.trackTimeouts.bind(this));
  this.breaker.on('success', this.trackSuccessfulResponse.bind(this));
  this.breaker.on('failure', this.trackFailedResponse.bind(this));
  this.breaker.on('request', this.trackRequest.bind(this));
  this.breaker.on('latency', this.trackLatency.bind(this));
};

Stats.prototype.trackTimeouts = function () {
  this.timeouts++;
};

Stats.prototype.trackSuccessfulResponse = function () {
  this.successfulResponses++;
};

Stats.prototype.trackFailedResponse = function () {
  this.failedResponses++;
};

Stats.prototype.trackRequest= function () {
  this.totalRequests++;
};

Stats.prototype.trackLatency= function (latency) {
  this.totalLatency+= latency;
};

Stats.prototype.averageResponseTime = function () {
  var totalResponses = this.successfulResponses + this.failedResponses;

  return this.totalLatency / totalResponses;
};
