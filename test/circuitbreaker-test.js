'use strict';

var CircuitBreaker = require('../lib/circuit-breaker'),
    chai           = require('chai'),
    sinon          = require('sinon');

chai.should();

describe('Circuit Breaker', function(){
  var callback;

  beforeEach(function () {
    callback = sinon.stub();
  });

  describe('#constructor', function () {
    it('should be in closed state', function () {
      var breaker = new CircuitBreaker(callback);
      breaker.isClosed().should.be.true;
    });

    it('should zero out current number of failures', function () {
      var breaker = new CircuitBreaker(callback);
      breaker._numFailures.should.equal(0);
    });
  });

  describe('#forceOpen', function () {

    it('should enter open state', function () {
      var breaker = new CircuitBreaker(callback);
      breaker.isClosed().should.be.true;

      breaker.forceOpen();

      breaker.isOpen().should.be.true;
      breaker.isClosed().should.be.false;
    });

    it('should enter half-open state after reset timeout', function (done) {
      var breaker = new CircuitBreaker(callback, {resetTimeout: 10});
      breaker.forceOpen();

      breaker.isOpen().should.be.true;

      setTimeout(function () {
        breaker.isHalfOpen().should.be.true;

        return done();
      }, 11);
    });

    it('should remain in open state till reset timeout has been reached', function (done) {
      var breaker = new CircuitBreaker(callback, {resetTimeout: 20});
      breaker.forceOpen();

      breaker.isOpen().should.be.true;

      setTimeout(function () {
        breaker.isOpen().should.be.true;

        return done();
      }, 19);
    });

    it('should emit open event', function (done) {
      var breaker = new CircuitBreaker(callback);

      breaker.on('open', function () {
        breaker.isOpen().should.be.true;
        done();
      });

      breaker.forceOpen();
    });


  });

  describe('#forceClosed', function () {

    it('should enter closed state', function () {
      var breaker = new CircuitBreaker(callback);

      breaker.forceOpen();
      breaker.isOpen().should.be.true;

      breaker.forceClosed();

      breaker.isClosed().should.be.true;
      breaker.isOpen().should.be.false;
    });

    it('should reset number of failrues to 0', function () {
      var breaker = new CircuitBreaker(callback);
      breaker._numFailures = 10;

      breaker.forceClosed();

      breaker._numFailures.should.equal(0);
    });

    it('should emit close event', function (done) {
      var breaker = new CircuitBreaker(callback);

      breaker.on('close', function () {
        done();
      });

      // circuit needs to first be forced open to trigger close event
      breaker.forceOpen();

      breaker.forceClosed();
    });

  });

  describe('#forceClosed', function () {
    it('should enter half-open state', function () {
      var breaker = new CircuitBreaker(callback);

      breaker.forceHalfOpen();

      breaker.isHalfOpen().should.be.true;
    });

    it('should emit halfOpen event', function (done) {
      var breaker = new CircuitBreaker(callback);

      breaker.on('halfOpen', function () {
        done();
      });

      breaker.forceHalfOpen();
    });

  });

  describe('#handleFailure', function () {

    it('should increment number of failures', function () {
      var breaker = new CircuitBreaker(callback);
      breaker.handleFailure();

      breaker._numFailures.should.equal(1);
    });

    it('should open circuit after max failures is reached', function () {
      var breaker = new CircuitBreaker(callback, {maxFailures: 3});

      breaker.handleFailure();
      breaker.handleFailure();
      breaker.handleFailure();

      breaker.isClosed().should.be.false;
      breaker.isOpen().should.be.true;
    });

    it('should open circuit when in half-open state', function () {
      var breaker = new CircuitBreaker(callback);
      breaker.forceHalfOpen();

      breaker.handleFailure();

      breaker.isOpen().should.be.true;
      breaker.isClosed().should.be.false;
    });

    it('should emit failure event', function (done) {
      var breaker = new CircuitBreaker(callback);

      breaker.on('failure', function () {
        return done();
      });

      breaker.handleFailure();
    });

  });

  describe('#handleSuccess', function () {

    it('should reset number of failures to 0', function () {
      var breaker = new CircuitBreaker(callback);
      breaker._numFailures = 10;

      breaker.handleSuccess();

      breaker._numFailures.should.equal(0);
    });

    it('should enter closed state when currently in half-open state', function () {
      var breaker = new CircuitBreaker(callback);
      breaker.forceHalfOpen();

      breaker.handleSuccess();

      breaker.isClosed().should.be.true;
    });

    it('should emit success event', function (done) {
      var breaker = new CircuitBreaker(callback);

      breaker.on('success', function () {
        return done();
      });

      breaker.handleSuccess();
    });

  });

  describe('invoke', function() {

    it('should remain closed on successful call', function(done){
      var breaker = new CircuitBreaker(callback);
      callback.withArgs('pass').yields(null, 'pass');

      breaker.invoke('pass').then(function (msg) {
        msg.should.equal('pass');
        breaker.isClosed().should.be.true;

        return done();
      }).fail(function(err) {
        return done(err);
      });
    });

    it('should enter open state after 3 failures', function(done){
      var breaker = new CircuitBreaker(callback, {maxFailures: 3});
      callback.yields(new Error('fail'));

      var noop = function (){};
      breaker.invoke('fail').fail(noop);
      breaker.invoke('fail').fail(noop);

      breaker.invoke('fail').fail(function () {

        callback.calledThrice.should.be.true;
        breaker.isOpen().should.be.true;

        return done();
      });

    });

    it('should fail fast when in open state', function(done){
      var breaker = new CircuitBreaker(callback);
      callback.yields(null, 'pass');
      breaker.forceOpen();

      breaker.invoke('pass').fail(function (err) {
        callback.called.should.be.false;
        'Error: CircuitBreaker open'.should.equal(err.toString() );

        return done();
      });

    });

    it('should emit rejected event when fast failing', function(done){
      var breaker = new CircuitBreaker(callback);
      callback.yields(null, 'pass');
      breaker.forceOpen();

      breaker.on('rejected', function () {
        return done();
      });

      breaker.invoke('pass').fail(function () {});
    });

    it('should invoke function once and then fail fast when in half-open state', function(done){
      var breaker = new CircuitBreaker(callback);
      callback.yieldsAsync(null, 'pass');
      breaker.forceHalfOpen();

      breaker.invoke('pass').then(function (msg) {
        msg.should.equal('pass');
        callback.calledOnce.should.be.true;
      });

      breaker.invoke('short').fail(function (err) {
        callback.calledOnce.should.be.true;

        'Error: CircuitBreaker open'.should.equal(err.toString() );
        return done();
      });
    });

    it('should emit request event', function(done){
      var breaker = new CircuitBreaker(callback);
      callback.yieldsAsync(null, 'pass');

      breaker.on('request', function () {
        return done();
      });

      breaker.invoke('pass');
    });

    it('should latency event on successful call', function(done){
      var clock = sinon.useFakeTimers();

      var timeout = function(callback) {
        setTimeout(callback, 20);
      };

      var breaker = new CircuitBreaker(timeout);

      breaker.on('latency', function(latency) {
        latency.should.equal(20);
        return done();
      });

      breaker.invoke();

      clock.tick(25);

      clock.restore();
    });

  });

  describe('timeout', function () {

    it('should enter open state after timing out', function(done) {
      var timeout = function(callback) {
        setTimeout(callback, 20);
      };

      var breaker = new CircuitBreaker(timeout, {timeout: 10, maxFailures: 3, resetTimeout: 3000});
      var noop = function () {};

      breaker.invoke().fail(noop);
      breaker.invoke().fail(noop);
      breaker.invoke().fail(noop);

      setTimeout(function () {
        breaker.isOpen().should.be.true;
        done();
      }, 25);
    });

    it('should clear timeout if returned before timeout period', function(done) {
      var breaker = new CircuitBreaker(callback, {timeout: 10, maxFailures: 3});
      callback.yieldsAsync(null, 'pass');

      breaker.invoke();
      breaker.invoke();
      breaker.invoke();

      setTimeout(function () {
        breaker.isClosed().should.be.true;
        done();
      }, 20);
    });

    it('should emit timeout event after timing out', function(done) {
      var timeout = function(callback) {
        setTimeout(callback, 20);
      };

      var breaker = new CircuitBreaker(timeout, {timeout: 10});

      breaker.on('timeout', function() {
        return done();
      });

      breaker.invoke().fail(function(){});
    });

  });
});
