// Karma configuration
//
"use strict"

/* eslint-disable no-magic-numbers */

module.exports = function (config) {
  config.set({

    // Base path that will be used to resolve all patterns (eg. files, exclude).
    basePath: "",

    // Start these browsers.
    // Available browser launchers:
    //   https://npmjs.org/browse/keyword/karma-launcher
    browsers: [
      // "Chrome",
      // "Safari",
      // "Firefox",
      "PhantomJS"
    ],

    // Frameworks to use
    // Available frameworks:
    //   https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["tap", "browserify"],

    // List of files / patterns to load in the browser.
    files: [
      "node_modules/babel-polyfill/dist/polyfill.js",
      "test/*.spec.js"
    ],

    // List of files to exclude.
    exclude: [
      "src/error.js"
    ],

    // Preprocess matching files before serving them to the browser.
    // Available preprocessors:
    //   https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "srcjs/**/*.js": ["browserify"],
      "test/**/*.js": ["browserify"]
    },

    // Browserify configuration
    // The coverage command goes here instead of the preprocessor because we
    // need it to work with browserify.
    browserify: {
      debug: true,
      transform: [
        [
          "babelify"
        ], [
          "browserify-istanbul",
          {
            instrumenter: require("isparta")
          }
        ]
      ]
    },

    // Optionally, configure the reporter.
    // Type text displays it within the console (alternative: text-summary).
    // Type lcov creates a codecov compatible report.
    coverageReporter: {
      reporters: [
        // {type: "text"},
        {type: "text-summary"},
        {type: "html", dir: "coverage/html"},
        {type: "lcov", dir: "coverage/lcov"},
        {type: "json", dir: "coverage/json",
         file: "coverage.json"}
      ]
    },

    // Test results reporter to use
    // Possible values: "dots", "progress"
    // Available reporters:
    //   https://npmjs.org/browse/keyword/karma-reporter
    // Coverage is from karma-coverage and provides Istanbul code coverage
    // reports.
    reporters: ["mocha", "coverage"],

    // web server port
    port: 9876,

    // Enable / disable colors in the output (reporters and logs).
    colors: true,

    // Level of logging
    // Possible values:
    //   config.LOG_DISABLE, config.LOG_ERROR, config.LOG_WARN, config.LOG_INFO,
    //   config.LOG_DEBUG
    logLevel: config.LOG_WARN,

    // Enable / disable watching file and executing tests whenever any file
    // changes.
    autoWatch: true,

    // Continuous Integration mode
    // If true, Karma captures browsers, runs the tests and exits.
    singleRun: false,

    // Concurrency level
    // How many browser should be started simultaneous.
    concurrency: Infinity
  })
}
