const path = require('path');
const pkg = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
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
        test: /\.(jpe?g|png|gif|svg|tga|babylon|mtl|pcb|pcd|prwm|gltf|obj|mat|mp3|ogg|woff|woff2)$/i,
        use: 'base64-inline-loader?name=[name].[ext]',
        exclude: path.resolve(__dirname, './node_modules/')
      }, {
        test: /\.(vert|frag|glsl|shader|txt|html)$/i,
        use: 'raw-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inlineSource: '.(js)$',
      'template': './src/index.html',
      'title': 'Break the Tower'
    }),
    new HtmlWebpackInlineSourcePlugin(),
  ]
}
