import { merge } from 'webpack-merge';
import common from './webpack.common.mjs';

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
  }
});
