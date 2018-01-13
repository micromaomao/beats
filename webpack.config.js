const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const dev = process.env.NODE_ENV !== 'production'

module.exports = {
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: [
            ['env', {
              targets: {
                browsers: ["last 10 versions", "safari >= 9"]
              }
            }]
          ]
        }
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader'
      }
    ]
  },
  devtool: 'source-map',
  entry: {
    'main': './js/main.js',
  },
  output: {
    path: path.join(__dirname, './dist'),
    publicPath: '/dist/',
    filename: '[hash]-[name].js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.pug',
      minify: {removeComments: true, useShortDoctype: true, sortClassName: true, sortAttributes: true},
      chunks: [ 'main' ],
      inject: false
    }),
    dev ? null : new webpack.optimize.UglifyJsPlugin({
      minimize: dev,
      compress: dev,
      sourceMap: true,
      comments: false
    })
  ].filter(x => x !== null)
}
