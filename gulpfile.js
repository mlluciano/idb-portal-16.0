'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var tap = require('gulp-tap');
var sourcemaps = require('gulp-sourcemaps');
var babelify = require('babelify');
var browserifyCss = require('browserify-css');
var _ = require("lodash");
var path = require("path");
var fse = require('fs-extra');
var less = require('gulp-less');

function transformChain(b, presets) {
  if(typeof presets !== "object") {
    presets = {
      "presets": [
        ["env", {
          "targets": {
            "node": "current"
          }
        }],
        "react"
      ]
    };
  }

  return b
    .transform(
        browserifyCss,
        {
            global: true,
            processRelativeUrl: function(relativeUrl) {
                var stripQueryStringAndHashFromPath = function(url) {
                    return url.split('?')[0].split('#')[0];
                };
                var rootDir = path.resolve(process.cwd());
                var relativePath = stripQueryStringAndHashFromPath(relativeUrl);
                var queryStringAndHash = relativeUrl.substring(relativePath.length);

                //
                // Copying files from '../node_modules/bootstrap/' to 'public/vendor/bootstrap/'
                //
                var prefix = 'node_modules/';
                if(_.startsWith(relativePath, prefix) && fse.existsSync(relativePath)) {
                    var vendorPath = 'public/vendor/' + relativePath.substring(prefix.length);
                    var source = path.join(rootDir, relativePath);
                    var target = path.join(rootDir, vendorPath);

                    gutil.log('Copying file from ' + JSON.stringify(source) + ' to ' + JSON.stringify(target));
                    fse.copySync(source, target);

                    // Returns a new path string with original query string and hash fragments
                    return vendorPath + queryStringAndHash;
                }

                return relativeUrl;
            }
        }
    )
    .transform(babelify, {
        "presets": presets,
        "plugins": [
          [
            "module-resolver",
            {
              "root": [
                "./"
              ],
              "alias": {}
            }
          ],
          "transform-promise-to-bluebird",
          "transform-react-display-name",
          "transform-class-properties",
          "transform-es2015-classes"
        ]
      }
    );
}

gulp.task('build', function() {

  return gulp.src('./public/client/js/react/src/**/*.js', {read: false}) // no need of reading file because browserify does.
    // transform file objects using gulp-tap plugin
    .pipe(tap(function(file) {
      gutil.log('bundling ' + file.path);
      // replace file contents with browserify's bundle stream
      file.contents = transformChain(browserify(file.path, {debug: true})).bundle();
    }))
    // transform streaming contents into buffer contents (because gulp-sourcemaps does not support streaming contents)
    .pipe(buffer())
    // load and init sourcemaps
    .pipe(sourcemaps.init({loadMaps: true}))
    // .pipe(uglify())
    // write sourcemaps
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/client/js/react/build'));

});

gulp.task('libs', function() {
  // set up the browserify instance on a task basis
  var b = transformChain(browserify({
    entries: './public/client/libs.js',
    debug: true,
  }), {
    "presets": [
      ["env", {
        "targets": {
          "browsers": "last 2 versions"
        }
      }],
      "react"
    ]
  });

  return b.bundle()
    .pipe(source('libs.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        // .pipe(uglify())
        .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('mapper', function() {
  // set up the browserify instance on a task basis
  var b = transformChain(browserify({
    entries: './public/client/idbmap.js',
    debug: true,
  }), {
    "presets": [
      ["env", {
        "targets": {
          "browsers": "last 2 versions"
        }
      }],
      "react"
    ]
  });

  return b.bundle()
    .pipe(source('idbmap.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        // .pipe(uglify())
        .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('client', function() {
  // set up the browserify instance on a task basis
  var b = transformChain(browserify({
    entries: './public/client/js/main.js',
    debug: true,
  }), {
    "presets": [
      ["env", {
        "targets": {
          "browsers": "last 2 versions"
        }
      }],
      "react"
    ]
  });

  return b.bundle()
    .pipe(source('client.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        // .pipe(uglify())
        .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('buildLess', function() {
    return gulp.src('./public/client/less/**/*.less')
    .pipe(less({
        paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('default', ["client", "mapper", "libs", "build", "buildLess"], function() {
});
