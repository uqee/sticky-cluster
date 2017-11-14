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
    debug: true,
    env: function (index) { return { stickycluster_worker_index: index }; }
  }
);
```


### Accepted options

Here's the full list of accepted options:

| key           | meaning                         | default                           |
| :------------ | :-----------------------------  | :-------------------------------- |
| `concurrency` | number of workers to be forked  | number of CPUs on the host system |
| `port`        | http port number to listen      | `8080`                            |
| `debug`       | log actions to console          | `false`                           |
| `prefix` | prefix in names of [IPC](https://en.wikipedia.org/wiki/Inter-process_communication) messages | `sticky-cluster:` |
| `env` | function (workerIndex => workerEnv) to provide additional worker configuration through the environment variables | sets `stickycluster_worker_index` (be aware that worker's index stays the same through its death and resurrection, but worker's id, which is used in debug messages, changes) |
| `hardShutdownDelay` | delay(ms) to trigger the `hard shutdown` if the `graceful shutdown` doesn't complete | `60 * 1000 ms` |
| `errorHandler` | callback function for the `net.Server.error` event on the `serverInstance` created in `master.js`. | `function (err) { console.log(err); process.exit(1); }` |

### Example

Open terminal at the `./example` directory and sequentially run `npm install` and `npm start`. Navigate to `http://localhost:8080`. Have a look at the source.


### Benchmarking

There's a script you can run to test various hashing functions. It generates a bunch of random IP addresses (both `v4` and `v6`) and then hashes them using different algorithms aiming to get a consistent {IP address -> array index} mapping. 

For every hash function the script outputs execution time in milliseconds (less is better) and distribution of IP addresses over the clients' ids (more even distribution is better).

```
$ cd ./benchmark
$ npm install
$ npm start -- <num_workers> <num_ip_addresses>
```

An output from my laptop:

```
$ npm start
generating random ips...
benchmarking...
int31
  time (ms):  188
  scatter:  [ 25788, 8378, 7768, 9438, 7280, 6649, 9648, 8061, 10287, 6703 ]
djb2
  time (ms):  20
  scatter:  [ 9957, 9809, 9853, 10075, 10077, 9957, 9982, 10068, 10179, 10043 ]
```

The algorithm used in the `sticky-session` module is `int31` and the local one is `djb2`. As might be seen, the `djb2` algorithm provides significant time advantage and clearly more even scattering over the worker processes.


### Changelog

#### 0.3.2 -> 0.3.3

+ Allow the caller to specify a callback function for the `net.Server.error` event on the `serverInstance` created in `master.js`.

#### 0.3.1 -> 0.3.2

+ Close alive connections before exiting to achieve `graceful shutdown`.
+ Add `hardShutdownDelay` option to trigger `hard shutdown` if the `graceful shutdown` doesn't complete in the amount of delay. 

#### 0.2.1 -> 0.3.0

+ Allow to set individual worker environment variables through the `options.env` function.

#### 0.2.0 -> 0.2.1

+ Handle empty IP addresses.

#### 0.1.2 -> 0.2.0

+ Removed a `SIGTERM` listener on the master process.
+ Replaced `.on('SIGINT', ...)` with `.once('SIGINT', ...)`.
+ Improved debug logs.
+ Moved unnecessary dependencies from the main package to the `./example` and `./benchmark` apps.
+ Fixed a few minor issues in the mentioned apps.

#### 0.1.1 -> 0.1.2

+ Updated the example.

#### 0.1.0 -> 0.1.1

+ Published to NPM.
