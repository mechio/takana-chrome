'use strict';

var webpack = require('webpack');

// Main
module.exports = {
  cache: true,
  entry: {
    eventPage: './src/eventPage.js',
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
    sourceMapFilename: '[file].map'
  }
};
