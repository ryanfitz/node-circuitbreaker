'use strict';

var CircuitBreaker = require('../lib/index'),
    chai           = require('chai'),
    expect         = chai.expect,
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

      breaker.invoke('fail');
      breaker.invoke('fail');

      breaker.invoke('fail').fail(function () {

        breaker.isOpen().should.be.true;

        return done();
      });

    });

    it('should fail fast when in open state', function(done){
      var breaker = new CircuitBreaker(callback);
      callback.yields(null, 'pass');
      breaker.forceOpen();

      breaker.invoke('pass').fail(function (err) {
        'Error: Circuit Breaker open'.should.equal(err.toString() );

        return done();
      });

    });
  });

});
