'use strict';

const circuitBreaker = require('../index');
const chai = require('chai');
const events = require('events');
const Stats = require('../lib/stats');
const sinon = require('sinon');

chai.should();

describe('Index', () => {
    let callback;

    beforeEach(() => {
        callback = sinon.stub();
    });

    describe('public api', () => {
        it('should have #isOpen method', () => {
            const breaker = circuitBreaker(callback);

            breaker.isOpen.should.be.instanceof(Function);
        });

        it('should have #isClosed method', () => {
            const breaker = circuitBreaker(callback);

            breaker.isClosed.should.be.instanceof(Function);
        });

        it('should have #forceOpen method', () => {
            const breaker = circuitBreaker(callback);

            breaker.forceOpen.should.be.instanceof(Function);
        });

        it('should have #forceClosed method', () => {
            const breaker = circuitBreaker(callback);

            breaker.forceClosed.should.be.instanceof(Function);
        });

        it('should have #forceHalfOpen method', () => {
            const breaker = circuitBreaker(callback);

            breaker.forceHalfOpen.should.be.instanceof(Function);
        });

        it('should have all event emitter methods', () => {
            const eventEmitterMethods = Object.keys(events.EventEmitter.prototype);
            const breaker = circuitBreaker(callback);

            eventEmitterMethods.forEach((method) => {
                breaker[method].should.be.instanceof(Function);
            });
        });

        it('should have stats object', () => {
            const breaker = circuitBreaker(callback);

            breaker.stats.should.be.instanceof(Stats);
        });
    });

    describe('Functional tests', () => {
        it('should succeed', (done) => {
            const breaker = circuitBreaker(callback);

            callback.yieldsAsync(null, 'pass');

            breaker('pass').then(() => done());
        });

        it('should fail', (done) => {
            const breaker = circuitBreaker(callback);

            callback.yieldsAsync(new Error('fail'));

            breaker('bad').fail(() => done());
        });
    });
});
