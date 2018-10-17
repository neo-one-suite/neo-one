import ExtractCssChunksPlugin from 'extract-css-chunks-webpack-plugin';
import webpack from 'webpack';
// @ts-ignore
import WebpackBar from 'webpackbar';
import { Bundle, Stage } from '../types';

export const plugins = ({ stage }: { readonly stage: Stage; readonly bundle: Bundle }) => [
  new webpack.EnvironmentPlugin({
    ...process.env,
    NODE_ENV: JSON.stringify(stage === 'dev' ? 'development' : 'production'),
  }),
  // tslint:disable-next-line no-any deprecation
  new webpack.NormalModuleReplacementPlugin(/^@reactivex\/ix-es2015-cjs(.*)$/, (resource: any) => {
    // tslint:disable-next-line no-object-mutation
    resource.request = resource.request.replace(/^@reactivex\/ix-es2015-cjs(.*)$/, '@reactivex/ix-esnext-esm$1');
  }),
  new WebpackBar({ profile: true }),
  stage === 'dev'
    ? new ExtractCssChunksPlugin({ hot: true })
    : new ExtractCssChunksPlugin({
        filename: '[name].[chunkHash:8].css',
        chunkFilename: '[id].[chunkHash:8].css',
      }),
];
