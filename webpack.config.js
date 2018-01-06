const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = {
  entry: "./src/",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[hash]bundle.js"
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    })
  ],
  devtool: "eval-source-map"
};

module.exports = config;