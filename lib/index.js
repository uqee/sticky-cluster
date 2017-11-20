'use strict';
module.exports = function (startFn, _options) {

  var options = (function () {
    var options = _options || {};
    return {
      prefix: options.prefix || 'sticky-cluster:',
      concurrency: options.concurrency || require('os').cpus().length,
      port: options.port || 8080,
      debug: options.debug || false,
      hardShutdownDelay: options.hardShutdownDelay || 60 * 1000,
      env: options.env || function (index) { return { stickycluster_worker_index: index }; },
      errorHandler: options.errorHandler || function (err) { console.log(err); process.exit(1); }      
    };
  })(_options);

  var cluster = require('cluster');
  var workers = require('./workers')(options);
  var master = require('./master')(workers, options);

  if (cluster.isMaster) master.start();
  else if (cluster.isWorker) startFn(workers.serve);
};
