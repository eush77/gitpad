'use strict';

var git = require('./src/server/git')('dist')
  , server = require('./server');

var gulp = require('gulp')
  , gulpLog = require('gulp-util').log
  , vinylTransform = require('vinyl-transform')
  , jade = require('gulp-jade')
  , browserify = require('browserify')
  , watch = require('gulp-watch')
  , livereload = require('gulp-livereload')
  , rimraf = require('rimraf')
  , extend = require('extend');

var path = require('path')
  , fs = require('fs')
  , util = require('util');


var client = {
  prefix: path.join.bind(path, 'src/client'),
  src: function (execSrc, watchSrc) {
    watchSrc = watchSrc || execSrc;
    return extend(gulp.src.bind(gulp, this.prefix(execSrc)),
                  { watch: this.prefix(watchSrc) });
  }
};

var src = {
  html: client.src('html/index.jade', 'html/*.jade'),
  css: client.src('css/*.css'),
  js: client.src('js/index.js', 'js/**/*.js')
};

var jobs = {
  html: function (src) {
    return src.pipe(jade())
              .pipe(gulp.dest('dist'));
  },

  css: function (src) {
    return src.pipe(gulp.dest('dist'));
  },

  js: function (src) {
    return src.pipe(vinylTransform(function (filename) {
      return browserify(filename).bundle();
    })).pipe(gulp.dest('dist'));
  }
};


gulp.task('html', function () {
  return jobs.html(src.html());
});

gulp.task('css', function () {
  return jobs.css(src.css());
});

gulp.task('js', function () {
  return jobs.js(src.js());
});

gulp.task('git', function () {
  fs.mkdir('dist', function () {
    fs.exists('dist/.git', function (exists) {
      if (!exists) {
        git('init').on('exit', function (code) {
          if (code != 0) {
            throw new Error('git-init failed.');
          }

          var contentFile = path.resolve('dist/content');

          fs.writeFile(contentFile, 'Welcome to GitPad!', function (err) {
            if (err) throw err;

            git('add', contentFile).on('exit', function (code) {
              if (code != 0) {
                throw new Error('git-add failed.');
              }

              git('commit', '-m', 'Init').on('exit', function (code) {
                if (code != 0) {
                  throw new Error('git-commit failed.');
                }

                gulpLog('GitPad repository initialized and committed to');
              });
            });
          });
        });
      }
    });
  });
});


gulp.task('default', ['html', 'css', 'js', 'git']);

gulp.task('clean', rimraf.bind(null, 'dist'));

gulp.task('server', ['default'], function () {
  server.start(function (port, hostname) {
    gulpLog(util.format('Server started listening on %s:%d', hostname, port));
  });
});

gulp.task('watch', function () {
  watch(src.html.watch, { name: 'HTML Watcher' }, function () {
    jobs.html(src.html())
        .pipe(livereload());
  });

  watch(src.css.watch, { name: 'CSS Watcher' }, function (files) {
    jobs.css(files)
        .pipe(livereload());
  });

  watch(src.js.watch, { name: 'JS Watcher' }, function () {
    jobs.js(src.js())
        .pipe(livereload());
  });
});
