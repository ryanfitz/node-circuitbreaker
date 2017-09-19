'use strict';

var circuitBreaker = require('../index'),
    chai           = require('chai'),
    events         = require('events'),
    Stats          = require('../lib/stats'),
    sinon          = require('sinon');

chai.should();

describe('Index', function(){
  var callback;

  beforeEach(function () {
    callback = sinon.stub();
  });

  describe('public api', function () {

    it('should have #isOpen method', function () {
      var breaker = circuitBreaker(callback);

      breaker.isOpen.should.be.instanceof(Function);
    });

    it('should have #isClosed method', function () {
      var breaker = circuitBreaker(callback);

      breaker.isClosed.should.be.instanceof(Function);
    });

    it('should have #forceOpen method', function () {
      var breaker = circuitBreaker(callback);

      breaker.forceOpen.should.be.instanceof(Function);
    });

    it('should have #forceClosed method', function () {
      var breaker = circuitBreaker(callback);

      breaker.forceClosed.should.be.instanceof(Function);
    });

    it('should have #forceHalfOpen method', function () {
      var breaker = circuitBreaker(callback);

      breaker.forceHalfOpen.should.be.instanceof(Function);
    });

    it('should have all event emitter methods', function () {
      var eventEmitterMethods = Object.keys(events.EventEmitter.prototype);
      var breaker = circuitBreaker(callback);

      eventEmitterMethods.forEach(function (method) {
        breaker[method].should.be.instanceof(Function);
      });

    });

    it('should have stats object', function () {
      var breaker = circuitBreaker(callback);
      breaker.stats.should.be.instanceof(Stats);
    });

  });

  describe('Functional tests', function () {

    it('should succeed', function (done) {
      var breaker = circuitBreaker(callback);
      callback.yieldsAsync(null, 'pass');

      breaker('pass').then(function () {
        return done();
      });

    });

    it('should fail', function (done) {
      var breaker = circuitBreaker(callback);
      callback.yieldsAsync(new Error('fail'));

      breaker('bad').fail(function () {
        return done();
      });

    });

  });
});
