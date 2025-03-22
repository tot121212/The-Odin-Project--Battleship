import { merge } from 'webpack-merge';
import common from './webpack.common.mjs';

// @ts-ignore
export default merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    static: './dist',
    open: true,
    hot: true,
    watchFiles: ['src/*'],
    historyApiFallback: true
  }
});
