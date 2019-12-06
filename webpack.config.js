const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bounty.js',
    path: path.resolve(__dirname, 'lib'),
    publicPath: '/',
    libraryTarget: 'umd',
    library: 'bounty'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  }
};
