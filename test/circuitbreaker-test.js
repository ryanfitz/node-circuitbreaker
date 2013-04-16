'use strict';

var circuitBreaker = require('../index');

require('chai').should();

describe('Circuit Breaker', function(){
  var breaker;

  beforeEach(function () {

    var func = function (name, callback) {
      return callback(null, 'hello ' + name);
    };

    breaker = circuitBreaker(func, {timeout: 10, resetTimeout: 10});
  });

  describe('stuff', function() {

    it('should work', function(done){
      breaker('bob').then(function (msg) {
        console.log('message is', msg);
      }).fail(function(err) {
        console.log('error is', err);
      }).done(function() {return done();});

    });

    it('should be open', function () {
      breaker.isOpen().should.be.true;
    });
  });
});
