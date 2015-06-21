'use strict';
module.exports = function (workers, options) {
  var DEBUG = options.debug,
      CONCURRENCY = options.concurrency,
      PORT = options.port,
      proxy, running;

  // functions

    function start () {

      // create custom scheduler
      var hash = require('string-hash'),
          proxyFn = function (connection) {
            var index = hash(connection.remoteAddress) % CONCURRENCY;
            workers.entrust(index, connection);
          };
      
      // create proxy
      proxy = require('net').createServer({ pauseOnConnect: true }, proxyFn);

      // start nodes
      workers.start();

      // start proxy
      running = true;
      proxy.listen(PORT, function () {
        if (DEBUG) console.log('[%d] master: started at port %d', Date.now(), PORT);
      });

      // stop everything if requested
      process
        .on('SIGINT', stop)
        .on('SIGTERM', stop);
    }

    function stop () {
      if (running) {
        running = false;
        proxy.close(function () {
          workers.stop();
          if (DEBUG) console.log('[%d] master: stopped', Date.now());
        });
      }
    }

  // interface

    return {
      start: start
    };

};
