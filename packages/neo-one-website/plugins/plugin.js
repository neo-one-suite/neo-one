import * as React from 'react';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import * as path from 'path';
import webpack from 'webpack';

export default () => ({
  webpack: (config, { stage, defaultLoaders }) => {
    config.resolve = {
      modules: [path.resolve(__dirname, '..', '..', '..', 'node_modules')].concat(config.resolve.modules),
      mainFields: ['browser', 'main'],
      aliasFields: ['browser'],
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
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
      ].filter((value) => value !== undefined),
    };

    const atl = {
      loader: 'awesome-typescript-loader',
      options: {
        useTranspileModule: stage === 'dev',
        transpileOnly: true,
        useCache: stage === 'dev',
        useBabel: true,
        babelOptions: babel,
        configFileName: path.resolve(__dirname, '..', '..', '..', 'tsconfig', 'tsconfig.es2017.esm.json'),
      },
    };
    const babelLoader = {
      loader: 'babel-loader',
      options: babel,
    };

    config.module.rules = [
      {
        oneOf: [
          {
            test: /\.tsx?$/,
            exclude: /(?:node_modules|\.worker\.tsx?)/,
            use: atl,
          },
          {
            test: /\.worker\.tsx?$/,
            exclude: /node_modules/,
            use: ['worker-loader', atl],
          },
          {
            test: /\.worker\.jsx?$/,
            include: /node_modules/,
            use: ['worker-loader'],
          },
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: babelLoader,
          },
          {
            test: /\.jsx?$/,
            include: path.resolve(__dirname, '..', '..', '..', 'node_modules', '@reactivex', 'ix-esnext-esm'),
            use: babelLoader,
          },
          defaultLoaders.cssLoader,
          defaultLoaders.fileLoader,
        ],
      },
    ];
    config.module.strictExportPresence = false;
    config.optimization.noEmitOnErrors = false;
    config.plugins = config.plugins.filter((plugin) => plugin.constructor.name !== 'NoEmitOnErrorsPlugin').concat([
      new webpack.NormalModuleReplacementPlugin(/^@reactivex\/ix-es2015-cjs(.*)$/, (resource) => {
        // tslint:disable-next-line no-object-mutation
        resource.request = resource.request.replace(/^@reactivex\/ix-es2015-cjs(.*)$/, '@reactivex/ix-esnext-esm$1');
      }),
    ]);

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
