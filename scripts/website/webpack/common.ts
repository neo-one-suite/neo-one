import webpack from 'webpack';
import { Bundle, Stage } from '../types';
import { alias } from './alias';
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
    alias,
  },
  optimization: optimization({ stage, bundle }),
  node,
  devtool: stage === 'dev' || stage === 'node' ? 'cheap-module-source-map' : 'source-map',
});
