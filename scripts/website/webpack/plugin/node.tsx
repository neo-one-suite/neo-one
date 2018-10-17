// tslint:disable no-any
import * as path from 'path';
import * as React from 'react';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import webpack from 'webpack';
// @ts-ignore
import { InjectManifest } from 'workbox-webpack-plugin';
import { Stage } from '../../types';
import { node as nodeSettings } from '../node';
import { plugins } from '../plugins';
import { rules } from '../rules';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

export const node = () => ({
  webpack: (mutableConfig: webpack.Configuration, { stage }: { stage: Stage }) => {
    const resolve = mutableConfig.resolve === undefined ? {} : mutableConfig.resolve;
    mutableConfig.resolve = {
      ...resolve,
      modules: resolve.modules,
      mainFields: ['browser', 'module', 'main'],
      aliasFields: ['browser'],
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
      alias: {
        ...(resolve.alias === undefined ? {} : resolve.alias),
        console$: path.resolve(__dirname, '..', 'console.js'),
        swimmer$: path.resolve(__dirname, 'swimmer.js'),
      },
    };

    const mod = mutableConfig.module === undefined ? {} : mutableConfig.module;
    mutableConfig.module = {
      ...mod,
      rules: rules({ stage }),
      strictExportPresence: false,
    };

    // tslint:disable-next-line:no-object-mutation
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

    const opt = mutableConfig.optimization === undefined ? {} : mutableConfig.optimization;
    mutableConfig.optimization = {
      ...opt,
      noEmitOnErrors: false,
    };

    const plugs = mutableConfig.plugins === undefined ? [] : mutableConfig.plugins;
    mutableConfig.plugins = plugs
      .filter((plugin) => plugin.constructor.name !== 'NoEmitOnErrorsPlugin')
      .concat(plugins({ stage, bundle: 'react-static' }))
      .concat([
        new InjectManifest({
          swSrc: path.resolve(APP_ROOT_DIR, 'dist', 'website', 'sw.js'),
        }),
      ]);

    mutableConfig.node = nodeSettings;

    return mutableConfig;
  },
  beforeRenderToElement: (App: any, { meta }: any) => {
    // tslint:disable-next-line:no-object-mutation
    meta.styleComponentsSheet = new ServerStyleSheet();

    return (props: any) => (
      <StyleSheetManager sheet={meta.styleComponentsSheet.instance}>
        <App {...props} />
      </StyleSheetManager>
    );
  },

  Head: ({ meta }: any) => <>{meta.styleComponentsSheet.getStyleElement()}</>,
});
