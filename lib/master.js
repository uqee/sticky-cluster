'use strict';
var log = require('./log');
module.exports = function (workers, options) {
  var DEBUG = options.debug;
  var CONCURRENCY = options.concurrency;
  var PORT = options.port;
  var HARD_SHUTDOWN_DELAY = options.hardShutdownDelay;
  var errorHandler = options.errorHandler;
  var connections = {};
  var serverInstance;
  
  function serverCreate () {
    var hash = require('string-hash');
    return require('net')
      .createServer({ pauseOnConnect: true }, function (connection) {

        // manage connections map
        var signature = connection.remoteAddress + ':' + connection.remotePort;
        connections[signature] = connection;
        connection.on('close', function () {
          delete connections[signature];
        });

        // choose a worker
        var index = hash(connection.remoteAddress || '') % CONCURRENCY;
        workers.entrust(index, connection);
      });
  }

  function serverStart (callback) {
    serverInstance = serverCreate().on('error', errorHandler);
    serverInstance.listen(PORT, callback);
  }

  function serverStop (callback) {

    // stop listening for new connections
    serverInstance.close(function (err) {
      if (err) console.log(err);
      else return callback();
    });

    // destroy active connections
    if (DEBUG) log('MASTER  destroy active connections...');
    Object.keys(connections).forEach(function(signature) {
      connections[signature].destroy();
    });
  }

  function stop () {
    
    // stop gracefully
    if (DEBUG) log('MASTER  stop..');
    serverStop(function () {

      // stop workers
      if (DEBUG) log('WORKERS  stop..');
      workers.stop();

      //
      if (DEBUG) log('MASTER  ..stopped');
    });

    // stop forced
    setTimeout(
      function () {

        // stop workers
        if (DEBUG) log('WORKERS  stop..');
        workers.stop();

        // kill master
        if (DEBUG) log('MASTER  killed');
        process.exit(1);
      },
      HARD_SHUTDOWN_DELAY,
    ).unref();
  }

  function start () {
    if (DEBUG) log('MASTER  start..');
    serverStart(function () {
      if (DEBUG) {
        log('MASTER  ..started at port %d', PORT);
        log('WORKERS  start..');
      }
      workers.start();
      process.once('SIGINT', stop);
    });
  }

  return {
    start: start,
    stop: stop
  };
};
