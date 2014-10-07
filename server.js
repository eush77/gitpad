'use strict';

var git = require('./src/server/git')('dist');

var concat = require('concat-stream');

var http = require('http')
  , fs = require('fs')
  , path = require('path');


var server = http.createServer(function (req, res) {
  console.log(req.method, req.url);

  var exit = function (code) {
    res.statusCode = code;
    res.end();
  };

  if (req.method == 'GET') {
    if (req.url == '/') {
      req.url = '/index.html';
    }
    req.url = path.join('dist', '.' + req.url);

    fs.exists(req.url, function (exists) {
      if (exists) {
        fs.createReadStream(req.url).pipe(res);
      }
      else {
        exit(404);
      }
    });

    return;
  }

  if (req.method == 'POST') {
    if (req.url != '/content') {
      exit(403);
      return;
    }
    var contentFile = path.resolve('dist/content');

    req.pipe(concat(function (reqdata) {
      reqdata = JSON.parse(reqdata);

      if (reqdata.action == 'commit') {
        fs.writeFile(contentFile, reqdata.content, function () {
          git('add', contentFile).on('exit', function (code) {
            if (code != 0) {
              exit(500);
              return;
            }

            git('commit', '-m', 'Update').on('exit', function (code) {
              exit((code == 0) ? 200 : 500);
            });
          });
        });
      }
      else if (reqdata.action == 'revert') {
        git('reset', '--hard', 'HEAD^').on('exit', function (code) {
          if (code != 0) {
            exit(500);
            return;
          }

          fs.createReadStream(contentFile).pipe(res);
        });
      }
    }));

    return;
  }

  res.statusCode = 501;
  res.end();
});


server.start = function (port, hostname, cb) {
  if (typeof port == 'function') {
    cb = port;
    port = hostname = null;
  }
  else if (typeof hostname == 'function') {
    cb = hostname;
    hostname = null;
  }

  port = port || 1337;
  hostname = hostname || 'localhost';

  this.listen(port, hostname);

  if (cb) {
    cb(port, hostname);
  }
};


if (!module.parent) {
  server.start(process.argv[2]);
}

module.exports = server;
