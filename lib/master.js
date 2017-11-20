'use strict';
var log = require('./log');
module.exports = function (workers, options) {
  var DEBUG = options.debug;
  var CONCURRENCY = options.concurrency;
  var PORT = options.port;
  var serverInstance;
  var HARD_SHUTDOWN_DELAY = options.hardShutdownDelay;
  var connMap = {};
  var errorHandler = options.errorHandler;
  
  function serverCreate () {
    var hash = require('string-hash');
    return require('net')
      .createServer({ pauseOnConnect: true }, function (connection) {

        // Create our connection key...
        var key = `${connection.remoteAddress}:${connection.remotePort}`;
        
        // Add it to our map...
        connMap[key] = connection;

        // Add a handler for when the connection is closed...
        connection.on('close', () => {
          // Remove it from the map
          delete connMap[key];
        });

        var index = hash(connection.remoteAddress || '') % CONCURRENCY;
        workers.entrust(index, connection);
      });
  }

  function serverStart (callback) {
    serverInstance = serverCreate().on('error', errorHandler);
    serverInstance.listen(PORT, callback);
  }

  function serverStop (callback) {
    serverInstance.close(function (err) {
      if (err) console.log(err);
      else return callback();
    });

    if (DEBUG) log('MASTER  destroy all connections...');
    // Destroy all active connections...
    Object.keys(connMap).forEach(k => {
      // Destroy the connection...
      connMap[k].destroy();
    });
  }

  function stop () {
    if (DEBUG) log('MASTER  stop..');
    serverStop(function () {
      if (DEBUG) {
        log('MASTER  ..stopped');
        log('WORKERS  stop..');
      }
      workers.stop();
    });

    // Trigger a "hard" shutdown in HARD_SHUTDOWN_DELAY ms
    setTimeout(hardShutdown, HARD_SHUTDOWN_DELAY).unref();
  }

  function hardShutdown() {
    // Log it...
    if (DEBUG) log('MASTER  hard shutdown...');
    
    workers.stop();

    // Try to exit with a failed status code...
    process.exit(1);
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
