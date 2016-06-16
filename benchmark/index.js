'use strict';

// inputs
  
  var CONCURRENCY = parseInt(process.argv[2], 10) || 10;
  var ITERATIONS = parseInt(process.argv[3], 10) || 100000;

// hashes

  // 'djb2' algorithm

    var hash_djb2 = require('string-hash');
    var djb2 = function (ip) { return hash_djb2(ip) % CONCURRENCY; };

  // 'int31' algorithm from sticky-sessions

    var hash_int31 = function (ip, seed) {
      var hash = ip.reduce(function(r, num) {
        r += parseInt(num, 10);
        r %= 2147483648;
        r += (r << 10);
        r %= 2147483648;
        r ^= r >> 6;
        return r;
      }, seed);

      hash += hash << 3;
      hash %= 2147483648;
      hash ^= hash >> 11;
      hash += hash << 15;
      hash %= 2147483648;

      return hash >>> 0;
    };
    var seed = ~~(Math.random() * 1e9);
    var int31 = function (ip) { return hash_int31((ip || '').split(/\./g), seed) % CONCURRENCY; };

// get random ips

  console.log('generating random ips...');

  var Chance = require('chance');
  var chance = new Chance();
  var ips = [];
  var i = ITERATIONS;

  while (--i >= 0) {
    ips.push((i % 2) ? chance.ip() : chance.ipv6());
  }

// benchmarking

  console.log('benchmarking...');

  function benchmark (ips, hash, concurrency, iterations) {

    var scatter = [];
    var i = concurrency;
    while (--i >= 0) scatter.push(0);

    var index;
    var timeStart;
    var timeFinish;
    i = iterations;

    timeStart = Date.now();
    while (--i >= 0) {
      index = hash(ips[i]);
      scatter[index]++;
    }
    timeFinish = Date.now();

    console.log('  time (ms): ', timeFinish - timeStart);
    console.log('  scatter: ', scatter);
  }

  console.log('int31');
  benchmark(ips, int31, CONCURRENCY, ITERATIONS);

  console.log('djb2');
  benchmark(ips, djb2, CONCURRENCY, ITERATIONS);
