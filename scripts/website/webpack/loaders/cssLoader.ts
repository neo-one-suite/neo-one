import autoprefixer from 'autoprefixer';
import ExtractCssChunksPlugin from 'extract-css-chunks-webpack-plugin';
import * as path from 'path';
// @ts-ignore
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import { Bundle, Stage } from '../../types';
import { browsers } from '../browsers';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

function initCSSLoader(stage: Stage, bundle: Bundle) {
  return [
    {
      loader: 'cache-loader',
      options: {
        cacheDirectory: path.resolve(APP_ROOT_DIR, 'node_modules', '.cache', 'css', bundle),
      },
    },
    {
      loader: 'css-loader',
      options: {
        importLoaders: 1,
        minimize: stage === 'prod',
        sourceMap: false,
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        ident: 'postcss',
        plugins: () => [
          postcssFlexbugsFixes,
          autoprefixer({
            browsers,
            flexbox: 'no-2009', // I'd opt in for this - safari 9 & IE 10.
            // tslint:disable-next-line no-any
          } as any),
        ],
      },
    },
  ];
}

export const cssLoader = ({ stage, bundle }: { readonly stage: Stage; readonly bundle: Bundle }) => {
  const loaders = initCSSLoader(stage, bundle);
  if (stage === 'node') {
    return {
      test: /\.css$/,
      loader: loaders,
    };
  }

  return {
    test: /\.css$/,
    loader: [ExtractCssChunksPlugin.loader, ...loaders],
  };
};
