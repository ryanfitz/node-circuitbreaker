'use strict';

var Stats  = require('../lib/stats'),
    chai   = require('chai'),
    events = require('events');

chai.should();

describe('Stats', function(){

  var stats,
      mockBreaker;

  beforeEach(function () {
    mockBreaker = new events.EventEmitter();
    stats = new Stats(mockBreaker);
  });

  it('should track total number of timeouts', function(done) {

    mockBreaker.once('timeout', function () {
      stats.timeouts.should.equal(1);
      done();
    });

    mockBreaker.emit('timeout');
  });

  it('should track total number of successful responses', function(done) {

    mockBreaker.once('success', function () {
      stats.successfulResponses.should.equal(1);
      done();
    });

    mockBreaker.emit('success');
  });

  it('should track total number of failed responses', function(done) {

    mockBreaker.once('failure', function () {
      stats.failedResponses.should.equal(1);
      done();
    });

    mockBreaker.emit('failure');
  });

  it('should track total number of requests', function(done) {

    mockBreaker.once('request', function () {
      stats.totalRequests.should.equal(1);
      done();
    });

    mockBreaker.emit('request');
  });

  it('should track total response time', function(done) {
    mockBreaker.emit('latency', 45);

    mockBreaker.once('latency', function () {
      stats.totalLatency.should.equal(100);
      done();
    });

    mockBreaker.emit('latency', 55);
  });

  it('should calculate average response time', function(done) {
    mockBreaker.emit('success');
    mockBreaker.emit('latency', 30);

    mockBreaker.emit('failure');
    mockBreaker.emit('latency', 40);

    mockBreaker.emit('success');

    mockBreaker.once('latency', function () {
      stats.averageResponseTime().should.equal(40);
      done();
    });

    mockBreaker.emit('latency', 50);
  });


});
