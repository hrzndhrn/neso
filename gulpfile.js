'use strict';

//------------------------------------------------------------------------------
// modules
//
const gulp = require('gulp'),
      babel = require('gulp-babel'),
      sourcemaps = require('gulp-sourcemaps'),
      eslint = require('gulp-eslint'),
      flow = require('gulp-flowtype'),
      del = require('del'),
      karma = require('karma'),
      rename = require('gulp-rename'),
      path = require('path'),
      postCss = require('gulp-postcss'),
      sorting = require('postcss-sorting'),
      stylelint = require('gulp-stylelint'),
      cleanCss = require('gulp-clean-css'),
      autoprefixer = require('autoprefixer'),
      sass = require('gulp-sass'),
      util = require('gulp-util');

/* eslint-disable no-unused-vars */
/* This const are not used in this gulpfile. This is just a workaround for
 * npm-check and modules used by karma.
 */
const babelify = require('babelify'),
      browserify = require('browserify'),
      browserifyIstanbul = require('browserify-istanbul'),
      watchify = require('watchify');
/* eslint-enable no-unused-vars */

//------------------------------------------------------------------------------
// config
//
const allJs = '**/*.js',
      mainJs = 'meso.js',
      mainScss = 'main.scss',
      targetCss = 'neso.css',
      targetMinCss = 'neso.min.css',
      exclude = {
        nodeModules: '!node_modules/**',
        dist: '!dist/**'
      },
      src = {
        'main': path.join('src', mainJs),
        'js': path.join('src', allJs),
        'test': path.join('test', allJs),
        'mainScss': path.join('src', 'css', mainScss)
      },
      dist = path.join('dist'),
      distCss = path.join(dist, 'css'),
      coverage = 'coverage/',
      options = {
        // babel: see .babelrc
        flow: {},
        karma: {
          configFile: path.join(__dirname, 'karma.conf.js')
        }
      };

//------------------------------------------------------------------------------
// globals
//
const MODE = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
  PUBLISH: 'publish'
};

let mode = MODE.DEVELOPMENT;

function isDevelopmentMode() {
  return mode === MODE.DEVELOPMENT;
}

//------------------------------------------------------------------------------
// check
//
gulp.task('check:eslint', checkEslint);
function checkEslint() {
  var stream =  gulp.src([allJs, exclude.nodeModules, exclude.dist])
    .pipe(eslint({
      rules: {
        'no-console': isDevelopmentMode() ? 'off' : 'error'
      }
    }))
    .pipe(eslint.format());

  if (!isDevelopmentMode()) {
    stream.pipe(eslint.failAfterError())
  }

  return stream;
}

gulp.task('check:flow', checkFlow);
function checkFlow() {
  options.flow.abort = isDevelopmentMode() ? false : true;
  return gulp.src([src.js, src.test])
    .pipe(flow(options.flow));
}

gulp.task('check:stylelint:src', checkStylelintSrc);
function checkStylelintSrc() {
  const src = ['src/css/**/*.scss',
               '!src/css/neso/_normalize.scss',
               '!src/css/neso/normalize/**/*'],
        config = {
          failAfterError: false,
          configFile: 'stylelintrc.src',
          reporters: [
            {formatter: 'string', console: true}
          ]
        };


  return gulp.src(src)
    .pipe(stylelint(config));
}

gulp.task('check:stylelint:normalize', checkStylelintNormalize);
function checkStylelintNormalize() {
  const src = ['src/css/neso/_normalize.scss',
               'src/css/neso/normalize/**/*.scss'],
        config = {
          failAfterError: false,
          configFile: 'stylelintrc.normalize',
          reporters: [
            {formatter: 'string', console: true}
          ]
        };


  return gulp.src(src)
    .pipe(stylelint(config));
}

gulp.task('check:stylelint:dist', checkStylelintDist);
function checkStylelintDist() {
  const src = ['dist/css/neso.css',
               /*'dist/css/neso.min.css'*/],
        config = {
          failAfterError: false,
          configFile: 'stylelintrc.dist',
          reporters: [
            {formatter: 'string', console: true}
          ]
        };


  return gulp.src(src)
    .pipe(stylelint(config));
}


//------------------------------------------------------------------------------
// build: javascript: ES6 -> babel -> ES5
//
gulp.task('build:js', buildJs);
function buildJs() {
  return gulp.src(src.js)
    .pipe(sourcemaps.init())
    .pipe(babel())
    // .pipe(sourcemaps.write(".")) // external soure map
    .pipe(sourcemaps.write()) // internal soure map
    .pipe(gulp.dest(dist));
}

gulp.task('copy:flow', copyFlow);
function copyFlow() {
  return gulp.src(src.js)
    .pipe(rename({'extname': '.js.flow'}))
    .pipe(gulp.dest(dist));
}

gulp.task('build:sass', buildSass);
function buildSass() {
  return gulp.src(src.mainScss)
    // .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(sass().on('error', sass.logError))
    .pipe(postCss([ autoprefixer({ browsers: ['> 1%'] }) ]))
    // .pipe(cleanCss({keepBreaks:true}))
    .pipe(postCss([ sorting()]))
    .pipe(rename(targetCss))
    .pipe(gulp.dest(distCss));

}

gulp.task('build:sass:min', buildSassMin);
function buildSassMin() {
  return gulp.src(src.mainScss)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postCss([ autoprefixer({ browsers: ['> 1%'] }) ]))
    .pipe(cleanCss({keepBreaks:true}))
    .pipe(sourcemaps.write())
    .pipe(rename(targetMinCss))
    .pipe(gulp.dest(distCss));

}

//------------------------------------------------------------------------------
// test
//
gulp.task('test', gulp.series(testKarma));
function testKarma(done) {
  new karma.Server({
    configFile: options.karma.configFile,
    singleRun: true
  }, done).start();
}

//------------------------------------------------------------------------------
// change mode
//
gulp.task('mode:publish', changeMode(MODE.PUBLISH));
function changeMode(newMode) {
  return function(done) {
    mode = newMode;
    done();
  }
}


//------------------------------------------------------------------------------
// main tasks
//
gulp.task('clean', clean);
function clean() {
  return del([dist, coverage]);
}

gulp.task('build',
  gulp.series( 'clean',
    gulp.parallel('build:js')
  )
);

gulp.task('check:stylelint',
    gulp.series('build:sass', 'build:sass:min', 'check:stylelint:src',
      'check:stylelint:normalize',  'check:stylelint:dist'));

gulp.task('watch:css', gulp.series(watchCss));
function watchCss(done) {
  gulp.watch(['src/css/**/*.scss', 'test/**/*'],
    gulp.series('check:stylelint'))
    .on('all', function(event, path, stats) {
      console.log('File ' + path + ' was ' + event + ', running tasks...');
    });
  // done();
}

gulp.task('check', gulp.series('check:eslint', 'check:flow'));

gulp.task('publish',
  gulp.series('mode:publish', 'clean', 'check', 'build:js', 'copy:flow'));

gulp.task('default', function(done) {
  util.log('Available tasks: build, check, ,test, clean');
  done();
});
