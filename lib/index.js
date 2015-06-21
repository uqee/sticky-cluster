'use strict';
module.exports = function (startFn, _options) {

  function getOptions (options) {
    return {
      prefix: options.prefix || 'sticky-cluster:',
      concurrency: options.concurrency || require('os').cpus().length,
      port: options.port || 8080,
      debug: options.debug || false
    };
  }

  var cluster = require('cluster'),
      options = getOptions(_options),
      workers = require('./workers')(options),
      master = require('./master')(workers, options);

  if (cluster.isMaster) master.start();
  else if (cluster.isWorker) startFn(workers.serve);

};
