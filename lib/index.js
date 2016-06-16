'use strict';
module.exports = function (startFn, _options) {

  function getOptions (_options) {
    var options = _options || {};
    return {
      prefix: options.prefix || 'sticky-cluster:',
      concurrency: options.concurrency || require('os').cpus().length,
      port: options.port || 8080,
      debug: options.debug || false
    };
  }

  var cluster = require('cluster');
  var options = getOptions(_options);
  var workers = require('./workers')(options);
  var master = require('./master')(workers, options);

  if (cluster.isMaster) master.start();
  else if (cluster.isWorker) startFn(workers.serve);
};
