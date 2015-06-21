# sticky-cluster


### What is it

`socket.io` requires that you use sticky sessions, to ensure that a given client hits the same process each time, otherwise its handshake mechanism will not properly work. They suggest using the `sticky-session` module if you want to use cluster: [link](http://socket.io/docs/using-multiple-nodes/).

This module is based on the same principles as `sticky-session`, but uses more efficient [hash function](https://github.com/darkskyapp/string-hash) and also this module works asynchronously out of the box.


#### Advantages

* up to 10x faster than `sticky-session`
* much better scattering over the worker processes than that of `sticky-session`
* asynchronous out of the box, just run a callback when you're done initializing everything else
* works correctly with `ipv6`


#### More alternatives

* [sticky-session](https://github.com/indutny/sticky-session) -- worse perfomance, not async
* [throng](https://github.com/hunterloftis/throng) -- plain cluster, not sticky
* [node-cluster-socket.io](https://github.com/elad/node-cluster-socket.io) -- doesn't work with `ipv6`


### Get started

As usual

```
npm install sticky-cluster --save
```

then

```js
var sticky = require('sticky-cluster'),
    options = {
      concurrency: 10,
      port: 3000,
      debug: true
    };

function startFn (callback) {
  var http = require('http'),
      app = require('express')(),
      server = http.createServer(app);
  
  // configure an app
  // do some async stuff if needed
  
  // don't do server.listen(), just pass server instance into the sticky module
  callback(server);
}

sticky(startFn, options);
```

For more detailed example have a look at `./etc/example.js`.


### Accepted options

Here's the full list of accepted options:

| key           | meaning                         | default                           |
| :------------ | :-----------------------------  | :-------------------------------- |
| `concurrency` | number of workers to be forked  | number of CPUs on the host system |
| `port`        | http port number to listen      | `8080`                            |
| `debug`       | log actions to console          | false                             |
| `prefix`      | prefix in names of [IPC](https://en.wikipedia.org/wiki/Inter-process_communication) messages | `sticky-cluster:`                 |


### Benchmarking

There's a script you can run to test the various hashing functions. It generates a bunch of random IP addresses (both `v4` and `v6`) and then hashes them using each of two hashing algorithms to get a consistent IP address -> array index mapping. 

The time it took is printed in milliseconds (less is better) and distribution of IP addresses to array index is printed (more equal distribution the better).

To run with your own parameters:

```
$ node ./etc/benchmark <num_workers> <num_ip_addresses>
```

or just use defaults (`num_workers = 10`, `num_ip_addresses = 100000`):

```
$ node ./etc/benchmark
```

Here's output from my machine:

```
$ node ./etc/benchmark.js 10 10000
generating random ips...
benchmarking...
int31
  time (ms):  17
  scatter:  [ 2629, 911, 1081, 736, 657, 988, 858, 782, 677, 681 ]
djb2
  time (ms):  3
  scatter:  [ 997, 981, 996, 1000, 1003, 1019, 983, 1002, 1014, 1005 ]
```

```
$ node ./etc/benchmark
generating random ips...
benchmarking...
int31
  time (ms):  140
  scatter:  [ 27367, 6818, 8184, 9313, 8065, 9153, 7893, 8196, 6792, 8219 ]
djb2
  time (ms):  21
  scatter:  [ 10005, 10006, 9920, 9926, 10132, 10071, 10046, 9924, 10022, 9948 ]
```

The algorithm used in the `sticky-session` module is `int31` and the local one is `djb2`. As you can see, time difference is significant and scattering over the worker processes is much better with `djb2` algorithm.
