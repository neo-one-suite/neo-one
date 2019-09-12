// prettier:disable
// tslint:disable no-any
import * as path from 'path';
import * as React from 'react';
import webpack from 'webpack';
// @ts-ignore
import nodeExternals from 'webpack-node-externals';
// @ts-ignore
import { GenerateSW } from 'workbox-webpack-plugin';
import { Stage } from '../../types';
import { addDefaultRules } from '../addDefaultRules';
import { alias } from '../alias';
import { node as nodeSettings } from '../node';
import { optimization } from '../optimization';
import { plugins } from '../plugins';
import { rules } from '../rules';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..', '..');
const WEBSITE_DIR = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-website');

const inlineScript = (body: string, key?: string) => (
  <script key={key} type="text/javascript" dangerouslySetInnerHTML={{ __html: body }} />
);

const GTM = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'UA-92599752-3');
gtag('config', 'UA-92599752-3', { 'transport_type': 'beacon'});

// Feature detects Navigation Timing API support.
if (window.performance) {
  // Gets the number of milliseconds since page load
  // (and rounds the result since the value must be an integer).
  var timeSincePageLoad = Math.round(performance.now());

  // Sends the timing event to Google Analytics.
  gtag('event', 'timing_complete', {
    'name': 'load',
    'value': timeSincePageLoad,
    'event_category': 'JS Dependencies'
  });
}
`;

export const node = () => ({
  webpack: (mutableConfig: webpack.Configuration, { stage: stageIn }: { stage: Stage }) => {
    const stage = process.env.NEO_ONE_PROD === 'true' && stageIn === 'dev' ? 'prod' : stageIn;
    const resolve = mutableConfig.resolve === undefined ? {} : mutableConfig.resolve;
    mutableConfig.resolve = {
      ...resolve,
      mainFields: ['browser', 'module', 'main'],
      aliasFields: ['browser'],
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
      alias: {
        ...(resolve.alias === undefined ? {} : resolve.alias),
        ...alias,
      },
    };

    const mod = mutableConfig.module === undefined ? {} : mutableConfig.module;
    mutableConfig.module = {
      ...mod,
      rules: rules({ stage, bundle: 'react-static' }),
      strictExportPresence: false,
    };
    addDefaultRules(mutableConfig);

    if (stage !== 'node') {
      mutableConfig.optimization = optimization({ stage, bundle: 'react-static' });
    }

    const plugs = mutableConfig.plugins === undefined ? [] : mutableConfig.plugins;
    mutableConfig.plugins = plugs
      .filter(
        (plugin) =>
          plugin.constructor.name !== 'NoEmitOnErrorsPlugin' &&
          plugin.constructor.name !== 'ExtractCssChunksPlugin' &&
          plugin.constructor.name !== 'EnvironmentPlugin',
      )
      .concat(plugins({ stage, bundle: 'react-static' }))
      .concat(
        stage === 'node' || process.env.NEO_ONE_DISABLE_SW === 'true'
          ? []
          : [
              new GenerateSW({
                swDest: 'sw.js',
                include: [/.(js|css|html|woff|woff2|json|png|svg|wasm)$/],
                clientsClaim: true,
                runtimeCaching: [
                  {
                    urlPattern: /^https:\/\/.*.jsdelivr.com/,
                    handler: 'CacheFirst',
                    options: {
                      cacheName: 'jsdelivr',
                      expiration: {
                        maxEntries: 100000,
                        purgeOnQuotaError: true,
                      },
                      cacheableResponse: {
                        statuses: [0, 200],
                      },
                      matchOptions: {
                        ignoreSearch: true,
                      },
                    },
                  },
                ],
                offlineGoogleAnalytics: true,
                ...(stageIn === 'prod'
                  ? {
                      globDirectory: path.resolve(WEBSITE_DIR, 'dist'),
                      globPatterns: ['**/*.{js,css,html,woff,woff2,json,png,svg,wasm}'],
                      maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
                    }
                  : {}),
              }),
            ],
      );

    mutableConfig.node = nodeSettings;

    if (stage === 'node') {
      mutableConfig.externals = [
        nodeExternals({
          whitelist: [
            'react-universal-component',
            'webpack-flush-chunks',
            'react-static',
            'react-static/templates',
            'react-static/plugins',
            /.*neo-one.*/,
          ],
        }),
      ];
    }

    mutableConfig.devtool = stage === 'dev' ? 'cheap-module-source-map' : 'source-map';

    return mutableConfig;
  },
  headElements: async (elements: any, { meta }: any) => [
    ...elements,
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-92599752-3" />,
    inlineScript(GTM),
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />,
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />,
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />,
    <link rel="manifest" href="/manifest.json" />,
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />,
    <meta name="theme-color" content="#ffffff" />,
    <meta name="application-name" content="NEO•ONE" />,
    // @ts-ignore
    <meta charset="utf-8" />,
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />,
    <meta name="viewport" content="width=device-width, initial-scale=1" />,
  ],
});
