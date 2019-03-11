import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
// @ts-ignore
import ExtractCssChunksPlugin from 'extract-css-chunks-webpack-plugin';
// @ts-ignore
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import { Bundle, Stage } from '../../types';
import { browsers } from '../browsers';

function initCSSLoader(stage: Stage) {
  const plugins = stage === 'prod' ? [cssnano] : [];

  return [
    {
      loader: 'css-loader',
      options: {
        importLoaders: 1,
        sourceMap: false,
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        ident: 'postcss',
        plugins: () =>
          plugins.concat([
            postcssFlexbugsFixes,
            autoprefixer({
              browsers,
              flexbox: 'no-2009', // I'd opt in for this - safari 9 & IE 10.
              // tslint:disable-next-line no-any
            } as any),
          ]),
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
