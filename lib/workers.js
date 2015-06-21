'use strict';
module.exports = function (options) {
  var cluster = require('cluster'),
      DEBUG = options.debug,
      CONCURRENCY = options.concurrency,
      PREFIX = options.prefix,
      ids = [], running;

  // functions

    function create (index) {

      // create
      var worker = cluster.fork();
      ids[index] = worker.id;

      // revive dead
      worker.on('exit', function (code, signal) {
        if (DEBUG) console.log('[%d] worker %d: died', Date.now(), worker.id);
        if (running) create(index);
      });

      // log
      if (DEBUG) console.log('[%d] worker %d: forked', Date.now(), worker.id);
    }

    function serve (server) {
      var worker = cluster.worker,
          id = worker.id;

      // listen for master's commands
      process.on('message', function (message, connection) {

        // ignore every message except master's
        if (message === PREFIX + 'connection') {

          // log
          if (DEBUG) console.log('[%d] worker %d: got conn from %s', Date.now(), id, connection.remoteAddress);

          // emulate a connection event on the server by emitting the
          // event with the connection the master sent us
          server.emit('connection', connection);

          // resume as we already catched the conn
          connection.resume();
        }
      });

      // start local server
      server.listen(0 /* start on random port */, 'localhost' /* accept conn from this host only */);
    }

    function entrust (index, connection) {
      var id = ids[index];
      if (DEBUG) console.log('[%d] master: conn from %s goes to worker %d', Date.now(), connection.remoteAddress, id);
      cluster.workers[id].send(PREFIX + 'connection', connection);
    }

    function kill (index) {
      var id = ids[index];
      if (DEBUG) console.log('[%d] worker %d: kill', Date.now(), id);
      cluster.workers[id].process.kill(/* if no argument is given, 'SIGTERM' is sent */);
    }

    function createAll () {
      var i = CONCURRENCY;
      while (--i >= 0) create(i);
    }

    function killAll () {
      var i = CONCURRENCY;
      while (--i >= 0) kill(i);
    }

    function start () {
      running = true;
      createAll();
    }

    function stop () {
      if (running) {
        running = false;
        killAll();
      }
    }

  // interface

    return {
      start: start,
      serve: serve,
      entrust: entrust,
      stop: stop
    };

};
