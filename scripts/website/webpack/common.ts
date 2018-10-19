import * as path from 'path';
import webpack from 'webpack';
import { Bundle, Stage } from '../types';
import { node } from './node';
import { optimization } from './optimization';

export const common = ({
  stage,
  bundle,
}: {
  readonly stage: Stage;
  readonly bundle: Bundle;
}): webpack.Configuration => ({
  mode: stage === 'dev' || stage === 'node' ? 'development' : 'production',
  resolve: {
    mainFields: ['browser', 'main'],
    aliasFields: ['browser'],
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    alias: {
      console$: path.resolve(__dirname, 'console.js'),
    },
  },
  optimization: optimization({ stage, bundle }),
  node,
  devtool: stage === 'dev' || stage === 'node' ? 'cheap-module-source-map' : 'source-map',
});
