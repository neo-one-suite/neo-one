// @ts-ignore
import history from 'connect-history-api-fallback';
// @ts-ignore
import convert from 'koa-connect';
// @ts-ignore
import MiniHtmlWebpackPlugin from 'mini-html-webpack-plugin';
import * as path from 'path';
import webpack from 'webpack';
// @ts-ignore
import serve from 'webpack-serve';

const createWebpackConfig = (): webpack.Configuration => ({
  mode: 'development',
  entry: ['core-js/modules/es7.symbol.async-iterator', path.resolve(__dirname, '..', 'src', 'entry.tsx')],
  resolve: {
    mainFields: ['browser', 'main'],
    aliasFields: ['browser'],
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },
  output: {
    path: path.resolve(__dirname, '..', 'root'),
    publicPath: '/',
  },
  plugins: [
    new MiniHtmlWebpackPlugin({
      context: {
        title: 'NEO•ONE',
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
  ],
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
              plugins: ['react-hot-loader/babel'],
            },
            configFileName: path.resolve(__dirname, '..', 'tsconfig', 'tsconfig.es2017.esm.json'),
          },
        },
      },
      {
        test: /\.woff2?$/,
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
    fs: 'empty',
    path: 'empty',
  },
});

const createServer = async (): Promise<{ readonly app: { readonly stop: (cb: () => void) => void } }> => {
  const webpackConfig = createWebpackConfig();

  return serve(
    {},
    {
      config: webpackConfig,
      open: true,
      hotClient: true,
      // tslint:disable-next-line no-any
      add: (app: any) => {
        app.use(
          convert(
            history({
              verbose: false,
              htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
              index: '/index.html',
            }),
          ),
        );
      },
      content: path.resolve(__dirname, '..', 'root'),
    },
  );
};

const logError = (error: Error) => {
  // tslint:disable-next-line:no-console
  console.error(error);
};

const log = (message: string) => {
  // tslint:disable-next-line:no-console
  console.log(message);
};

Promise.resolve()
  .then(async () => {
    const { app } = await createServer();
    const exit = (code: number) => {
      app.stop(() => process.exit(code));
    };

    process.on('uncaughtException', (error) => {
      logError(error);
      process.exit(1);
    });

    process.on('unhandledRejection', (error) => {
      logError(error);
    });

    process.on('SIGINT', () => {
      log('Exiting...');
      exit(0);
    });

    process.on('SIGTERM', () => {
      log('Exiting...');
      exit(0);
    });
  })
  .catch(() => {
    process.exit(1);
  });
