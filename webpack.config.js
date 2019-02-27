const path = require('path');
const pkg = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildPath = './build/';

module.exports = {
  entry: ['./src/entry.js'],
  output: {
    path: path.join(__dirname, buildPath),
    filename: '[name].[hash].js'
  },
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /three\.module\.js$/,
        use: [{
          loader: 'expose-loader',
          options: 'THREE'
        }]
      },
      {
        test: /cannon\.js$/,
        use: [{
          loader: 'expose-loader',
          options: 'CANNON'
        }]
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      },{
        test: /\.(jpe?g|png|gif|svg|tga|babylon|mtl|pcb|pcd|prwm|gltf|obj|mat|mp3|ogg)$/i,
        use: 'base64-inline-loader?name=[name].[ext]',
        exclude: path.resolve(__dirname, './node_modules/')
      },{
        test: /\.(vert|frag|glsl|shader|txt)$/i,
        use: 'raw-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({'title': 'three-seed project'})
  ]
}
