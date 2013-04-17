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

});
