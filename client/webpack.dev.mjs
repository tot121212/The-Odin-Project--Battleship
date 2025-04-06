import { merge } from 'webpack-merge';
import common from './webpack.common.mjs';
import path from 'path';
import { port } from "../shared/websocket.config.mjs";

// @ts-ignore
export default merge(common, {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(process.cwd(), 'dist'),
    },
    open: false,
    hot: true,
    watchFiles: ['src/*'],
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: `http://localhost:${port}`,
      },
      {
        context: ['/myws'],
        target: `ws://localhost:${port}`,
        ws: true,
      },
    ],
  },
});
