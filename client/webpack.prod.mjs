import { merge } from 'webpack-merge';
import common from './webpack.common.mjs';

// @ts-ignore
export default merge(common, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true,
  }
});
