import { merge } from 'webpack-merge';
import common from './webpack.common.mjs';
import webpack from 'webpack';

// @ts-ignore
export default merge(common, {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    static: './dist',
    open: false,
    hot: true,
    watchFiles: ['src/*'],
    historyApiFallback: true
  },
  // resolve: {
  //   fallback: {
  //     "path": "path-browserify",
  //     "process": "process/browser",
  //     "fs": false,
  //   },
  // },
  // plugins: [
  //   new webpack.ProvidePlugin({
  //     process: 'process/browser', // Ensures process is available in all files
  //   })
  // ],
});
