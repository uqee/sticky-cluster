'use strict';
var log = require('./log');
module.exports = function (workers, options) {
  var DEBUG = options.debug;
  var CONCURRENCY = options.concurrency;
  var PORT = options.port;
  var serverInstance;

  function serverCreate () {
    var hash = require('string-hash');
    return require('net')
      .createServer({ pauseOnConnect: true }, function (connection) {
        var index = hash(connection.remoteAddress || '') % CONCURRENCY;
        workers.entrust(index, connection);
      });
  }

  function serverStart (callback) {
    serverInstance = serverCreate();
    serverInstance.listen(PORT, callback);
  }

  function serverStop (callback) {
    serverInstance.close(function (err) {
      if (err) console.log(err);
      else return callback();
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
