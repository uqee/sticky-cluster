'use strict';
module.exports = function (workers, options) {
  var DEBUG = options.debug;
  var CONCURRENCY = options.concurrency;
  var PORT = options.port;
  var serverInstance;
  var serverIsRunning;

  function serverCreate () {
    var hash = require('string-hash');
    return require('net')
      .createServer({ pauseOnConnect: true }, function (connection) {
        var index = hash(connection.remoteAddress) % CONCURRENCY;
        workers.entrust(index, connection);
      });
  }

  function serverStart (callback) {
    serverIsRunning = true;
    serverInstance = serverCreate();
    serverInstance.listen(PORT, function () {
      if (DEBUG) console.log('[%d] master: started at port %d', Date.now(), PORT);
      return callback();
    });
  }

  function serverStop (callback) {
    if (serverIsRunning) {
      serverIsRunning = false;
      serverInstance.close(function (err) {
        if (DEBUG) console.log('[%d] master: stopped', Date.now());
        return callback();
      });
    }
  }

  function stop () {

    // stop proxy server
    serverStop(function () {

      // stop nodes
      workers.stop();
    });
  }

  function start () {
    
    // start proxy server
    serverStart(function () {

      // start nodes
      workers.start();

      // stop everything when requested
      process
        .on('SIGINT', stop)
        .on('SIGTERM', stop);
    });
  }

  return {
    start: start,
    stop: stop
  };
};
