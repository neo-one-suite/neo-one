// @ts-ignore
import history from 'connect-history-api-fallback';
// @ts-ignore
import convert from 'koa-connect';
import * as path from 'path';
// @ts-ignore
import serve from 'webpack-serve';
import { createWebpackConfig } from './createWebpackConfig';

const createServer = async (): Promise<{ readonly app: { readonly stop: (cb: () => void) => void } }> => {
  const webpackConfig = createWebpackConfig({ mode: 'dev' });

  return serve(
    {},
    {
      config: webpackConfig,
      open: false,
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
