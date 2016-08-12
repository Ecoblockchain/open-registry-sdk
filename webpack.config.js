var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: {
    consumer: "./lib/consumer.js",
    registrant: "./lib/registrant.js",
    registrar: "./lib/registrar.js",
    provider: "./lib/provider.js"
  },
  output: {
    path: path.join(__dirname, 'browser'),
    filename: "[name].bundle.js",
    chunkFilename: "[id].bundle.js"
  },

  resolve: {
    extensions: ['', '.js', 'index.js', '.json', 'index.json']
  },

  module: {
    preLoaders: [
        { test: /\.json$/, loader: 'json'},
        { test: /\.proto$/, loader: "proto-loader"}
    ],
    loaders: [
        { test: /\.js$/, loader: 'babel-loader', plugins: [], query: {presets: ['es2015']}},
    ]
  },
  resolveLoader: {
        root: path.join(__dirname, 'node_modules'),
        packageMains: ['json-loader']
  },
  devtool: '#eval'
}