'use strict';

const Stats = function (circuitbreaker) {
    this.breaker = circuitbreaker;

    this.initCounters();

    this.breaker.on('timeout', this.trackTimeouts.bind(this));
    this.breaker.on('success', this.trackSuccessfulResponse.bind(this));
    this.breaker.on('failure', this.trackFailedResponse.bind(this));
    this.breaker.on('rejected', this.trackRejected.bind(this));
    this.breaker.on('request', this.trackRequest.bind(this));
    this.breaker.on('latency', this.trackLatency.bind(this));
};

Stats.prototype.initCounters = function () {
    this.timeouts = 0;
    this.successfulResponses = 0;
    this.failedResponses = 0;
    this.totalRequests = 0;
    this.latencies = [];
    this.rejectedRequests = 0;
};

Stats.prototype.totalLatency = function () {
    return this.latencies.reduce((previousValue, currentValue) => previousValue + currentValue, 0);
};

Stats.prototype.trackTimeouts = function () {
    this.timeouts += 1;
};

Stats.prototype.trackSuccessfulResponse = function () {
    this.successfulResponses += 1;
};

Stats.prototype.trackFailedResponse = function () {
    this.failedResponses += 1;
};

Stats.prototype.trackRejected = function () {
    this.rejectedRequests += 1;
};

Stats.prototype.trackRequest = function () {
    this.totalRequests += 1;
};

Stats.prototype.trackLatency = function (latency) {
    this.latencies.push(latency);
};

Stats.prototype.averageResponseTime = function () {
    if (this.latencies.length === 0) {
        return 0;
    }

    return this.totalLatency() / this.latencies.length;
};

Stats.prototype.concurrentRequests = function () {
    const totalResponses = this.successfulResponses + this.failedResponses + this.rejectedRequests;

    return this.totalRequests - totalResponses;
};

Stats.prototype.reset = function () {
    this.initCounters();
};

module.exports = Stats;
