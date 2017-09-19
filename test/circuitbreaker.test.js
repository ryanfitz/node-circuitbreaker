'use strict';

const CircuitBreaker = require('../lib/circuit-breaker');
const assert = require('chai').assert;
const sinon = require('sinon');

// chai.should();

describe('Circuit Breaker', () => {
    let callback;

    beforeEach(() => {
        callback = sinon.stub();
    });

    describe('#constructor', () => {
        it('should be in closed state', () => {
            const breaker = new CircuitBreaker(callback);

            assert.isTrue(breaker.isClosed());
        });

        it('should zero out current number of failures', () => {
            const breaker = new CircuitBreaker(callback);

            assert.equal(breaker.numFailures, 0);
        });
    });

    describe('#forceOpen', () => {
        it('should enter open state', () => {
            const breaker = new CircuitBreaker(callback);

            assert.isTrue(breaker.isClosed());

            breaker.forceOpen();

            assert.isTrue(breaker.isOpen());
            assert.isFalse(breaker.isClosed());
        });

        it('should enter half-open state after reset timeout', (done) => {
            const breaker = new CircuitBreaker(callback, { resetTimeout: 10 });

            breaker.forceOpen();

            assert.isTrue(breaker.isOpen());

            setTimeout(() => {
                assert.isTrue(breaker.isHalfOpen());

                return done();
            }, 11);
        });

        it('should remain in open state till reset timeout has been reached', (done) => {
            const breaker = new CircuitBreaker(callback, { resetTimeout: 20 });

            breaker.forceOpen();

            assert.isTrue(breaker.isOpen());

            setTimeout(() => {
                assert.isTrue(breaker.isOpen());

                return done();
            }, 19);
        });

        it('should emit open event', (done) => {
            const breaker = new CircuitBreaker(callback);

            breaker.on('open', () => {
                assert.isTrue(breaker.isOpen());
                done();
            });

            breaker.forceOpen();
        });
    });

    describe('#forceClosed', () => {
        it('should enter closed state', () => {
            const breaker = new CircuitBreaker(callback);

            breaker.forceOpen();
            assert.isTrue(breaker.isOpen());

            breaker.forceClosed();

            assert.isTrue(breaker.isClosed());
            assert.isFalse(breaker.isOpen());
        });

        it('should reset number of failrues to 0', () => {
            const breaker = new CircuitBreaker(callback);

            breaker.numFailures = 10;

            breaker.forceClosed();

            breaker.numFailures.should.equal(0);
        });

        it('should emit close event', (done) => {
            const breaker = new CircuitBreaker(callback);

            breaker.on('close', () => {
                done();
            });

            // circuit needs to first be forced open to trigger close event
            breaker.forceOpen();

            breaker.forceClosed();
        });
    });

    describe('#forceClosed', () => {
        it('should enter half-open state', () => {
            const breaker = new CircuitBreaker(callback);

            breaker.forceHalfOpen();

            assert.isTrue(breaker.isHalfOpen());
        });

        it('should emit halfOpen event', (done) => {
            const breaker = new CircuitBreaker(callback);

            breaker.on('halfOpen', () => {
                done();
            });

            breaker.forceHalfOpen();
        });
    });

    describe('#handleFailure', () => {
        it('should increment number of failures', () => {
            const breaker = new CircuitBreaker(callback);

            breaker.handleFailure();

            breaker.numFailures.should.equal(1);
        });

        it('should open circuit after max failures is reached', () => {
            const breaker = new CircuitBreaker(callback, { maxFailures: 3 });

            breaker.handleFailure();
            breaker.handleFailure();
            breaker.handleFailure();

            assert.isFalse(breaker.isClosed());
            assert.isTrue(breaker.isOpen());
        });

        it('should open circuit when in half-open state', () => {
            const breaker = new CircuitBreaker(callback);

            breaker.forceHalfOpen();

            breaker.handleFailure();

            assert.isTrue(breaker.isOpen());
            assert.isFalse(breaker.isClosed());
        });

        it('should emit failure event', (done) => {
            const breaker = new CircuitBreaker(callback);

            breaker.on('failure', () => done());

            breaker.handleFailure();
        });
    });

    describe('#handleSuccess', () => {
        it('should reset number of failures to 0', () => {
            const breaker = new CircuitBreaker(callback);

            breaker.numFailures = 10;

            breaker.handleSuccess();

            breaker.numFailures.should.equal(0);
        });

        it('should enter closed state when currently in half-open state', () => {
            const breaker = new CircuitBreaker(callback);

            breaker.forceHalfOpen();

            breaker.handleSuccess();

            assert.isTrue(breaker.isClosed());
        });

        it('should emit success event', (done) => {
            const breaker = new CircuitBreaker(callback);

            breaker.on('success', () => done());

            breaker.handleSuccess();
        });
    });

    describe('invoke', () => {
        it('should remain closed on successful call', (done) => {
            const breaker = new CircuitBreaker(callback);

            callback.withArgs('pass').yields(null, 'pass');

            breaker.invoke('pass').then((msg) => {
                msg.should.equal('pass');
                assert.isTrue(breaker.isClosed());

                return done();
            }).fail(err => done(err));
        });

        it('should enter open state after 3 failures', (done) => {
            const breaker = new CircuitBreaker(callback, { maxFailures: 3 });

            callback.yields(new Error('fail'));

            const noop = function () {};

            breaker.invoke('fail').fail(noop);
            breaker.invoke('fail').fail(noop);

            breaker.invoke('fail').fail(() => {
                assert.isTrue(callback.calledThrice);
                assert.isTrue(breaker.isOpen());

                return done();
            });
        });

        it('should fail fast when in open state', (done) => {
            const breaker = new CircuitBreaker(callback);

            callback.yields(null, 'pass');
            breaker.forceOpen();

            breaker.invoke('pass').fail((err) => {
                assert.isFalse(callback.called);
                'Error: CircuitBreaker open'.should.equal(err.toString());

                return done();
            });
        });

        it('should emit rejected event when fast failing', (done) => {
            const breaker = new CircuitBreaker(callback);

            callback.yields(null, 'pass');
            breaker.forceOpen();

            breaker.on('rejected', () => done());

            breaker.invoke('pass').fail(() => {});
        });

        it('should invoke function once and then fail fast when in half-open state', (done) => {
            const breaker = new CircuitBreaker(callback);

            callback.yieldsAsync(null, 'pass');
            breaker.forceHalfOpen();

            breaker.invoke('pass').then((msg) => {
                msg.should.equal('pass');
                assert.isTrue(callback.calledOnce);
            });

            breaker.invoke('short').fail((err) => {
                assert.isTrue(callback.calledOnce);

                'Error: CircuitBreaker open'.should.equal(err.toString());

                return done();
            });
        });

        it('should emit request event', (done) => {
            const breaker = new CircuitBreaker(callback);

            callback.yieldsAsync(null, 'pass');

            breaker.on('request', () => done());

            breaker.invoke('pass');
        });

        it('should latency event on successful call', (done) => {
            const clock = sinon.useFakeTimers();

            const timeout = function (cb) {
                setTimeout(cb, 20);
            };

            const breaker = new CircuitBreaker(timeout);

            breaker.on('latency', (latency) => {
                latency.should.equal(20);

                return done();
            });

            breaker.invoke();

            clock.tick(25);

            clock.restore();
        });
    });

    describe('timeout', () => {
        it('should enter open state after timing out', (done) => {
            const timeout = function (cb) {
                setTimeout(cb, 20);
            };

            const breaker = new CircuitBreaker(timeout, {
                timeout: 10,
                maxFailures: 3,
                resetTimeout: 3000
            });
            const noop = function () {};

            breaker.invoke().fail(noop);
            breaker.invoke().fail(noop);
            breaker.invoke().fail(noop);

            setTimeout(() => {
                assert.isTrue(breaker.isOpen());
                done();
            }, 25);
        });

        it('should clear timeout if returned before timeout period', (done) => {
            const breaker = new CircuitBreaker(callback, { timeout: 10, maxFailures: 3 });

            callback.yieldsAsync(null, 'pass');

            breaker.invoke();
            breaker.invoke();
            breaker.invoke();

            setTimeout(() => {
                assert.isTrue(breaker.isClosed());
                done();
            }, 20);
        });

        it('should emit timeout event after timing out', (done) => {
            const timeout = function (cb) {
                setTimeout(cb, 20);
            };

            const breaker = new CircuitBreaker(timeout, { timeout: 10 });

            breaker.on('timeout', () => done());

            breaker.invoke().fail(() => {});
        });
    });

    describe('errorFn', () => {
        it('should break based on error function parameter', (done) => {
            const breakerFn = function (id, cb) {
                if (id < 0) {
                    return cb(id);
                }

                return cb(null, `data for id ${id}`);
            };

            const breaker = new CircuitBreaker(breakerFn, {
                timeout: 10,
                maxFailures: 3,
                resetTimeout: 30,
                errorFn(error) {
                    if (error === -2) {
                        return false;
                    }

                    return true;
                }
            });
            const noop = function () {};

            breaker.invoke(-1).fail(noop);
            breaker.invoke(-2).fail(noop);
            breaker.invoke(-1).fail(noop);
            assert.isTrue(breaker.isClosed());

            breaker.invoke(-1).fail(noop);
            assert.isTrue(breaker.isOpen());

            done();
        });

        it('should break the circuit normally without an error function', (done) => {
            const breakerFn = function (id, cb) {
                if (id < 0) {
                    return cb(id);
                }

                return cb(null, `data for id ${id}`);
            };

            const breaker = new CircuitBreaker(breakerFn, {
                timeout: 10,
                maxFailures: 3,
                resetTimeout: 30
            });
            const noop = function () {};

            breaker.invoke(-1).fail(noop);
            breaker.invoke(-2).fail(noop);
            breaker.invoke(-1).fail(noop);
            assert.isFalse(breaker.isClosed());

            breaker.invoke(-1).fail(noop);
            assert.isTrue(breaker.isOpen());

            done();
        });
    });
});
