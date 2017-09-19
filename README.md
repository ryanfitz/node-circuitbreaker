[node-circuitbreaker][3]
======================

[![Version][npm-image]][npm-url] ![Downloads][downloads-image] [![Build Status][status-image]][status-url] [![Open Issues][issues-image]][issues-url] [![Dependency Status][daviddm-image]][daviddm-url] ![License][license-image]

Circuit breaker is a [node.js][2] implementation of the [Circuit Breaker][1] pattern.
When properly configured it can aid in providing stability and prevent
cascading failures in distributed systems.

## Installation

    npm install circuitbreaker

## Examples
See the [examples][0] for more working sample code.

``` js
var circuitBreaker = require('circuitbreaker');

var loadDataFromRemoteServer = function (id, callback) {
  if (id < 0) {
    return callback(new Error('error loading data ' + id));
  } else {
    return callback(null, 'data for id ' + id);
  }
};

var breaker = circuitBreaker(loadDataFromRemoteServer, {timeout: 10, maxFailures: 3, resetTimeout: 30});

breaker(23).then(console.log);

breaker(-1).fail(console.log);
breaker(-1).fail(console.log);
breaker(-1).fail(console.log);

breaker(32).fail(function(err) {
  console.log('failed because breaker is open', err);
});

setTimeout(function () {
  breaker(32).then(function (data) {
    console.log('loaded data because circuit reset after timeout: ', data);
  });
}, 35);
```

## Usage

```bash
npm install screwdriver-node-circuitbreaker
```

## Testing

```bash
npm test
```

### License

(The MIT License)

Copyright (c) 2013 Ryan Fitzgerald

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[0]: https://github.com/screwdriver-cd/node-circuitbreaker/tree/master/examples
[1]: http://doc.akka.io/docs/akka/snapshot/common/circuitbreaker.html
[2]: http://nodejs.org
[3]: https://github.com/ryanfitz/node-circuitbreaker

[npm-image]: https://img.shields.io/npm/v/screwdriver-node-circuitbreaker.svg
[npm-url]: https://npmjs.org/package/screwdriver-node-circuitbreaker
[downloads-image]: https://img.shields.io/npm/dt/screwdriver-node-circuitbreaker.svg
[license-image]: https://img.shields.io/npm/l/screwdriver-node-circuitbreaker.svg
[issues-image]: https://img.shields.io/github/issues/screwdriver-cd/node-circuitbreaker.svg
[issues-url]: https://github.com/screwdriver-cd/node-circuitbreaker/issues
[status-image]: https://cd.screwdriver.cd/pipelines/334/badge
[status-url]: https://cd.screwdriver.cd/pipelines/334
[daviddm-image]: https://david-dm.org/screwdriver-cd/node-circuitbreaker.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/screwdriver-cd/node-circuitbreaker
