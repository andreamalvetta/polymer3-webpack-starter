'use strict';

const {resolve, join} = require('path');
const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ENV = process.argv.find(arg => arg.includes('production')) ? 'production' : 'development';
const OUTPUT_PATH = ENV === 'production' ? resolve('dist') : resolve('src');

const polyfills = [
  {
    from: resolve('./node_modules/@webcomponents/webcomponentsjs/webcomponents-*.js'),
    to: join(OUTPUT_PATH, 'vendor'),
    flatten: true
  }, {
    from: resolve('./node_modules/@webcomponents/webcomponentsjs/bundles/*.js'),
    to: join(OUTPUT_PATH, 'vendor', 'bundles'),
    flatten: true
  }, {
    from: resolve('./node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js'),
    to: join(OUTPUT_PATH, 'vendor'),
    flatten: true
  }
];

const assets = [
  {
    from: resolve('./src/vendor/babel-helpers.min.js'),
    to: join(OUTPUT_PATH, 'vendor')
  }, {
    from: resolve('./src/favicon.ico'),
    to: OUTPUT_PATH
  }, {
    from: resolve('./src/employees.json'),
    to: OUTPUT_PATH
  }
];

const commonConfig = merge([
  {
    entry: './src/index.js',
    devtool: 'cheap-module-source-map',
    output: {
      path: OUTPUT_PATH,
      filename: '[name].[chunkhash:8].js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: resolve('./src/index.html')
      })
    ],
    module: {
      rules: [
        {
          test: /\.(js|mjs)$/,
          // We need to transpile Polymer, do not exclude node_modules
          use: [
            {
              loader: 'babel-loader',
              options: {
                babelrc: true,
                extends: join(__dirname + '/.babelrc'),
                cacheDirectory: true
              }
            },
            {
              loader: 'uglify-template-string-loader'
            }
          ]
        }
      ]
    }
  },
]);

const developmentConfig = merge([
  {
    plugins: [
      new CopyWebpackPlugin(polyfills)
    ],
    devServer: {
      contentBase: OUTPUT_PATH,
      compress: true,
      overlay: true,
      port: 3000,
      host: '0.0.0.0',
      historyApiFallback: true
    }
  }
]);

const productionConfig = merge([
  {
    plugins: [
      new CleanWebpackPlugin([OUTPUT_PATH], {verbose: true}),
      new CopyWebpackPlugin([...polyfills, ...assets])
    ]
  }
]);

module.exports = mode => {
  if (mode === 'production') {
    return merge(commonConfig, productionConfig, {mode});
  }

  return merge(commonConfig, developmentConfig, {mode});
};
