const path = require("path");
const slsw = require("serverless-webpack");
const isLocal = slsw.lib.webpack.isLocal;

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: slsw.lib.entries,
  target: "node",
  resolve: {
    extensions: [".mjs", ".ts", ".js"],
  },
  output: {
    libraryTarget: "commonjs2",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
    ],
  },
};
