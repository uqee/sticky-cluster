'use strict';
var chalk; try { chalk = require('chalk'); } catch (e) {}
var moment; try { moment = require('moment'); } catch (e) {}

function getCurrentTime () {
  var dt = moment ? moment().format('HH:mm:ss.SSS') : Date.now();
  return chalk ? chalk.grey(dt) : dt;
}

module.exports = function () {
  process.stdout.write(getCurrentTime() + '  ');
  console.log.apply(console.log, arguments);
};
