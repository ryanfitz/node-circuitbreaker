'use strict';

var CircuitBreaker = require('../lib/index'),
    sinon          = require('sinon');

require('chai').should();

describe('Circuit Breaker', function(){
  var breaker,
      callback;

  beforeEach(function () {
    callback = sinon.stub();
    var func = function (name, callback) {
      return callback(new Error('foo'));
      //return callback(null, 'hello ' + name);
    };

    breaker = new CircuitBreaker(func, {timeout: 10, resetTimeout: 10, maxFailures: 3});
  });

  describe('stuff', function() {

    it('should work', function(done){
      breaker.invoke('bob').then(function (msg) {
        console.log('message is', msg);
      }).fail(function(err) {
        console.log('error is', err);
      }).done(function() {return done();});

    });
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

  });

});
