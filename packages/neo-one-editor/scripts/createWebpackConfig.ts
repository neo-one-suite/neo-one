// tslint:disable no-object-mutation no-any
// @ts-ignore
import HardSourceWebpackPlugin from 'hard-source-webpack-plugin';
// @ts-ignore
import MiniHtmlWebpackPlugin from 'mini-html-webpack-plugin';
import * as path from 'path';
import webpack from 'webpack';
// @ts-ignore
import WebpackBar from 'webpackbar';

interface Options {
  readonly mode: 'dev';
}

export const createWebpackConfig = ({ mode }: Options): webpack.Configuration => {
  const mutableConfig: webpack.Configuration = {
    mode: 'development',
    entry: path.resolve(__dirname, '..', 'src', 'preview', 'window', 'entry.tsx'),
    resolve: {
      mainFields: ['browser', 'main'],
      aliasFields: ['browser'],
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
      alias: {
        console$: path.resolve(__dirname, 'console.js'),
      },
    },
    output: {
      path: path.resolve(__dirname, '..', 'root'),
      publicPath: '/',
    },
    plugins: [
      new MiniHtmlWebpackPlugin({
        context: {
          title: 'NEO•ONE Preview',
        },
        // tslint:disable-next-line no-any
        template: ({ css, js, title, publicPath }: any) =>
          `<!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
              <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
              <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
              <link rel="manifest" href="/manifest.json">
              <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
              <meta name="theme-color" content="#ffffff">
              <title>${title}</title>
              ${MiniHtmlWebpackPlugin.generateCSSReferences(css, publicPath)}
              <style>
                body {
                  margin: 0;
                  background-color: #2E2837;
                  text-rendering: optimizeLegibility;
                }
              </style>
            </head>
            <body style="margin: 0px;">
              <div id="app"></div>
              ${MiniHtmlWebpackPlugin.generateJSReferences(js, publicPath)}
            </body>
          </html>`,
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development'),
      }),
      // tslint:disable-next-line no-any
      new webpack.NormalModuleReplacementPlugin(/^@reactivex\/ix-es2015-cjs(.*)$/, (resource: any) => {
        // tslint:disable-next-line no-object-mutation
        resource.request = resource.request.replace(/^@reactivex\/ix-es2015-cjs(.*)$/, '@reactivex/ix-esnext-esm$1');
      }),
      new WebpackBar({ profile: true }),
      mode === 'dev' ? new HardSourceWebpackPlugin({ cachePrune: { sizeThreshold: 1024 * 1024 * 1024 } }) : undefined,
    ].filter((value) => value !== undefined),
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'awesome-typescript-loader',
            options: {
              useTranspileModule: true,
              transpileOnly: true,
              useCache: true,
              useBabel: true,
              babelOptions: {
                presets: [
                  '@babel/preset-react',
                  [
                    '@babel/preset-env',
                    {
                      targets: { browsers: ['last 2 versions', 'not ie <= 11'] },
                      modules: false,
                      useBuiltIns: 'entry',
                      ignoreBrowserslistConfig: true,
                    },
                  ],
                ],
                plugins: [
                  [
                    'babel-plugin-styled-components',
                    {
                      pure: true,
                      displayName: false,
                    },
                  ],
                  '@babel/plugin-syntax-dynamic-import',
                  'babel-plugin-lodash',
                  '@babel/plugin-proposal-object-rest-spread',
                  '@babel/plugin-proposal-async-generator-functions',
                ],
              },
              configFileName: path.resolve(__dirname, '..', '..', '..', 'tsconfig', 'tsconfig.es2017.esm.json'),
            },
          },
        },
        {
          test: /\.(svg|mp3|woff|woff2|mp4|png)$/,
          loader: 'file-loader',
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: { minimize: false },
            },
          ],
        },
      ],
    },
    node: {
      console: 'mock',
      global: true,
      process: true,
      __filename: 'mock',
      __dirname: 'mock',
      Buffer: true,
      setImmediate: true,
      fs: 'empty',
    },
  };
  (mutableConfig as any).module.defaultRules = [
    {
      type: 'javascript/auto',
      resolve: {},
    },
    {
      test: /\.json$/i,
      type: 'json',
    },
  ];

  return mutableConfig;
};
