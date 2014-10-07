'use strict';

var spawn = require('child_process').spawn;


module.exports = function (repo) {
  return function () {
    return spawn('git', [].slice.call(arguments), { cwd: repo });
  };
};
