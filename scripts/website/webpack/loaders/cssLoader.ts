import autoprefixer from 'autoprefixer';
import ExtractCssChunksPlugin from 'extract-css-chunks-webpack-plugin';
// @ts-ignore
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import { Bundle, Stage } from '../../types';
import { browsers } from '../browsers';

function initCSSLoader(stage: Stage) {
  return [
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
  const loaders = initCSSLoader(stage);
  if (stage === 'node') {
    return {
      test: /\.css$/,
      loader: loaders,
    };
  }

  if (stage === 'dev' || bundle === 'tools' || process.env.NEO_ONE_CACHE === 'true') {
    return {
      test: /\.css$/,
      loader: ['style-loader', ...loaders],
    };
  }

  return {
    test: /\.css$/,
    loader: [ExtractCssChunksPlugin.loader, ...loaders],
  };
};
