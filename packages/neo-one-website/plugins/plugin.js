import * as React from 'react';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import * as path from 'path';
import webpack from 'webpack';
import WebpackBar from 'webpackbar';
import HardSourceWebpackPlugin from 'hard-source-webpack-plugin';
import { InjectManifest } from 'workbox-webpack-plugin';

const ROOT = path.resolve(__dirname, '..', '..', '..');

export default () => ({
  webpack: (config, { stage, defaultLoaders }) => {
    config.resolve = {
      ...(config.resolve || {}),
      modules: config.resolve.modules,
      mainFields: ['browser', 'main'],
      aliasFields: ['browser'],
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
      alias: {
        ...(config.resolve.alias || {}),
        console$: path.resolve(__dirname, 'console.js'),
      },
    };

    if (stage === 'dev') {
      config.output = {
        ...config.output,
        globalObject: `(typeof self !== 'undefined' ? self : this)`,
      };
    }

    const babel = {
      configFile: false,
      presets: [
        '@babel/preset-react',
        [
          '@babel/preset-env',
          {
            targets: stage === 'node' ? { node: true } : { browsers: ['last 2 versions', 'not ie <= 11'] },
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
            displayName: stage === 'dev',
          },
        ],
        stage === 'dev' ? 'react-hot-loader/babel' : 'babel-plugin-universal-import',
        '@babel/plugin-syntax-dynamic-import',
        'babel-plugin-lodash',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-async-generator-functions',
        process.env.NEOONE_COVERAGE === 'true' ? 'babel-plugin-istanbul' : undefined,
      ].filter((value) => value !== undefined),
    };

    const babelLoader = {
      loader: 'babel-loader',
      options: babel,
    };

    const tsLoaders = [
      babelLoader,
      {
        loader: 'ts-loader',
        options: {
          happyPackMode: true,
          transpileOnly: stage === 'dev',
          configFile: path.resolve(ROOT, 'tsconfig', 'tsconfig.es2017.esm.json'),
          onlyCompileBundledFiles: true,
          experimentalFileCaching: true,
          experimentalWatchApi: true,
        },
      },
    ];

    config.module.rules = [
      {
        oneOf: [
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: [{ loader: 'thread-loader', options: { poolTimeout: Number.POSITIVE_INFINITY } }].concat(tsLoaders),
          },
          {
            test: /\.jsx?$/,
            include: /react-static-routes/,
            use: babelLoader,
          },
          {
            test: /\.jsx?$/,
            include: path.resolve(ROOT, 'node_modules', '@reactivex', 'ix-esnext-esm'),
            use: babelLoader,
          },
          defaultLoaders.cssLoader,
          defaultLoaders.fileLoader,
        ],
      },
    ];
    config.module.defaultRules = [
      {
        type: 'javascript/auto',
        resolve: {},
      },
      {
        test: /\.json$/i,
        type: 'json',
      },
    ];
    config.module.strictExportPresence = false;
    config.optimization.noEmitOnErrors = false;
    config.plugins = config.plugins.filter((plugin) => plugin.constructor.name !== 'NoEmitOnErrorsPlugin').concat(
      [
        new webpack.NormalModuleReplacementPlugin(/^@reactivex\/ix-es2015-cjs(.*)$/, (resource) => {
          // tslint:disable-next-line no-object-mutation
          resource.request = resource.request.replace(/^@reactivex\/ix-es2015-cjs(.*)$/, '@reactivex/ix-esnext-esm$1');
        }),
        new WebpackBar({ profile: true }),
        stage === 'dev'
          ? new HardSourceWebpackPlugin({ cachePrune: { sizeThreshold: 1024 * 1024 * 1024 } })
          : undefined,
        new InjectManifest({
          swSrc: path.resolve(ROOT, 'dist', 'website', 'sw.js'),
        }),
      ].filter((value) => value !== undefined),
    );

    config.node = {
      console: 'mock',
      global: true,
      process: true,
      __filename: 'mock',
      __dirname: 'mock',
      Buffer: true,
      setImmediate: true,
      fs: 'empty',
    };

    return config;
  },

  beforeRenderToElement: (App, { meta }) => {
    meta.styleComponentsSheet = new ServerStyleSheet();
    return (props) => (
      <StyleSheetManager sheet={meta.styleComponentsSheet.instance}>
        <App {...props} />
      </StyleSheetManager>
    );
  },

  Head: ({ meta }) => <>{meta.styleComponentsSheet.getStyleElement()}</>,
});
