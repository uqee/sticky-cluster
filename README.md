# sticky-cluster


### What is it

In cluster environment `socket.io` requires you to use sticky sessions, to ensure that a given client hits the same process every time, otherwise its handshake mechanism won't work properly. To accomplish that, manuals [suggest](http://socket.io/docs/using-multiple-nodes/) the `sticky-session` module.

My module is based on the same principles as `sticky-session`, but utilizes a more efficient [hash function](https://github.com/darkskyapp/string-hash) and also works asynchronously out of the box.


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
require('sticky-cluster')(

  // server initialization function
  function (callback) {
    var http = require('http');
    var app = require('express')();
    var server = http.createServer(app);
      
    // configure an app
      // do some async stuff if needed
      
    // don't do server.listen(), just pass the server instance into the callback
    callback(server);
  },
  
  // options
  {
    concurrency: 10,
    port: 3000,
    debug: true
  }
);
```

For more detailed example have a look at `./example`.


### Accepted options

Here's the full list of accepted options:

| key           | meaning                         | default                           |
| :------------ | :-----------------------------  | :-------------------------------- |
| `concurrency` | number of workers to be forked  | number of CPUs on the host system |
| `port`        | http port number to listen      | `8080`                            |
| `debug`       | log actions to console          | `false`                             |
| `prefix`      | prefix in names of [IPC](https://en.wikipedia.org/wiki/Inter-process_communication) messages | `sticky-cluster:`                 |


### Benchmarking

There's a script you can run to test various hashing functions. It generates a bunch of random IP addresses (both `v4` and `v6`) and then hashes them using different algorithms aiming to get a consistent {IP address -> array index} mapping. 

For every hash function the script outputs execution time in milliseconds (less is better) and distribution of IP addresses over the clients' ids (more even distribution is better).

To run with your own parameters:

```
$ node ./etc/benchmark <num_workers> <num_ip_addresses>
```

or just use defaults (`num_workers = 10`, `num_ip_addresses = 100000`):

```
$ node ./etc/benchmark
```

An output from my laptop:

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

The algorithm used in the `sticky-session` module is `int31` and the local one is `djb2`. As might be seen, the `djb2` algorithm provides significant time advantage and clearly more even scattering over the worker processes.
