'use strict';

const Stats = require('../lib/stats');
const chai = require('chai');
const events = require('events');

chai.should();

describe('Stats', () => {
    let stats;
    let mockBreaker;

    beforeEach(() => {
        mockBreaker = new events.EventEmitter();
        stats = new Stats(mockBreaker);
    });

    it('should track total number of timeouts', (done) => {
        mockBreaker.once('timeout', () => {
            stats.timeouts.should.equal(1);
            done();
        });

        mockBreaker.emit('timeout');
    });

    it('should track total number of successful responses', (done) => {
        mockBreaker.once('success', () => {
            stats.successfulResponses.should.equal(1);
            done();
        });

        mockBreaker.emit('success');
    });

    it('should track total number of failed responses', (done) => {
        mockBreaker.once('failure', () => {
            stats.failedResponses.should.equal(1);
            done();
        });

        mockBreaker.emit('failure');
    });

    it('should track total number of rejected requests', (done) => {
        mockBreaker.once('rejected', () => {
            stats.rejectedRequests.should.equal(1);
            done();
        });

        mockBreaker.emit('rejected');
    });

    it('should track total number of requests', (done) => {
        mockBreaker.once('request', () => {
            stats.totalRequests.should.equal(1);
            done();
        });

        mockBreaker.emit('request');
    });

    it('should track total response time', (done) => {
        mockBreaker.emit('latency', 45);

        mockBreaker.once('latency', () => {
            stats.totalLatency().should.equal(100);
            done();
        });

        mockBreaker.emit('latency', 55);
    });

    it('should calculate average response time', (done) => {
        mockBreaker.emit('success');
        mockBreaker.emit('latency', 30);

        mockBreaker.emit('failure');
        mockBreaker.emit('latency', 40);

        mockBreaker.emit('success');

        mockBreaker.once('latency', () => {
            stats.averageResponseTime().should.equal(40);
            done();
        });

        mockBreaker.emit('latency', 50);
    });

    it('should calculate concurrent requests', (done) => {
        mockBreaker.emit('request');
        mockBreaker.emit('success');

        mockBreaker.emit('request');
        mockBreaker.emit('failure');

        mockBreaker.emit('request');

        mockBreaker.once('request', () => {
            stats.concurrentRequests().should.equal(2);
            done();
        });

        mockBreaker.emit('request');
    });

    it('should calculate concurrent requests when requests get rejected', (done) => {
        mockBreaker.emit('request');
        mockBreaker.emit('success');

        mockBreaker.emit('request');
        mockBreaker.emit('failure');

        mockBreaker.emit('request');
        mockBreaker.emit('rejected');

        mockBreaker.once('request', () => {
            stats.concurrentRequests().should.equal(1);
            done();
        });

        mockBreaker.emit('request');
    });

    describe('#reset', () => {
        it('should reset timesout to 0', (done) => {
            mockBreaker.emit('timeout');
            mockBreaker.emit('timeout');

            mockBreaker.once('timeout', () => {
                stats.timeouts.should.equal(3);

                stats.reset();

                stats.timeouts.should.equal(0);
                done();
            });

            mockBreaker.emit('timeout');
        });

        it('should reset total requests to 0', (done) => {
            mockBreaker.emit('request');

            mockBreaker.once('request', () => {
                stats.totalRequests.should.equal(2);

                stats.reset();

                stats.totalRequests.should.equal(0);
                done();
            });

            mockBreaker.emit('request');
        });

        it('should reset all attributes to 0', (done) => {
            mockBreaker.emit('request');
            mockBreaker.emit('failure');
            mockBreaker.emit('latency', 30);

            mockBreaker.emit('request');
            mockBreaker.emit('success');
            mockBreaker.emit('latency', 4);

            mockBreaker.emit('request');
            mockBreaker.emit('timeout');
            mockBreaker.emit('latency', 100);

            mockBreaker.once('request', () => {
                stats.reset();

                stats.totalRequests.should.equal(0);
                stats.timeouts.should.equal(0);
                stats.successfulResponses.should.equal(0);
                stats.failedResponses.should.equal(0);
                stats.totalLatency().should.equal(0);
                stats.averageResponseTime().should.equal(0);
                stats.concurrentRequests().should.equal(0);
                stats.rejectedRequests.should.equal(0);

                done();
            });

            mockBreaker.emit('request');
        });
    });
});
