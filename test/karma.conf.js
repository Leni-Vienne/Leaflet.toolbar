module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['mocha'],

    files: [
      '../node_modules/leaflet/dist/leaflet-src.js',
      '../node_modules/leaflet/dist/leaflet.css',
      '../node_modules/chai/chai.js',
      '../node_modules/sinon/pkg/sinon.js',
      '../dist/leaflet.toolbar.css',
      '../src/Toolbar.js',
      '../src/Action.js',
      '../src/Control.js',
      '../src/Popup.js',
      '../test/SpecHelper.js',
      '../test/src/*Spec.js',
    ],

    exclude: [],

    preprocessors: {
      '../src/*.js': 'coverage'
    },

    reporters: ['progress', 'coverage'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['ChromeHeadless'],

    plugins: [
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-coverage'
    ],

    singleRun: false,

    coverageReporter: {
      dir: '../coverage/',
      reporters: [
        { type: 'text', subdir: '.', file: 'coverage.txt' },
        { type: 'lcovonly', subdir: '.' },
        { type: 'html', subdir: 'html' }
      ]
    }
  });
};
