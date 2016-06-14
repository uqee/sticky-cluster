'use strict';
var sticky = require('sticky-cluster');

function startFn (callback) {
  var async = require('async');
  async.waterfall(
    [

      // connect to remote services

        function (callback) {
          async.parallel(
            [
              // fake db 1
              function (callback) { setTimeout(callback, 2000); },

              // fake db 2
              function (callback) { setTimeout(callback, 1000); }
            ],
            callback
          );
        },

      // configure the worker

        function (services, callback) {
          var http = require('http');
          var app = require('express')();
          var server = http.createServer(app);

          // get remote services
          var fakedb1 = services[0];
          var fakedb2 = services[1];

          // all express-related stuff goes here, e.g.
          app.use(function (req, res) { res.end('handled by pid = ', process.pid); });

          // all socket.io stuff goes here
          var io = require('socket.io')(server);

          // don't do server.listen(...)!
          // just pass the server instance to the final async's callback
          callback(null, server);
        }

    ],
    function (err, server) {

      // handle error
      if (err) { console.log(err); process.exit(1); }

      // pass server instance to sticky-cluster
      else callback(server);
    }
  );
}

sticky(startFn, {
  concurrency: parseInt(process.env.WEB_CONCURRENCY, 10),
  port: parseInt(process.env.PORT, 10),
  debug: (process.env.NODE_ENV === 'development')
});
