import * as path from 'path';
import webpack from 'webpack';
import { Stage } from '../types';
import { node } from './node';
import { optimization } from './optimization';

export const common = ({ stage }: { readonly stage: Stage }): webpack.Configuration => ({
  mode: stage === 'dev' ? 'development' : 'production',
  resolve: {
    mainFields: ['browser', 'main'],
    aliasFields: ['browser'],
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    alias: {
      console$: path.resolve(__dirname, 'console.js'),
    },
  },
  optimization: optimization({ stage }),
  node,
  devtool: stage === 'dev' ? 'cheap-module-source-map' : 'source-map',
});
