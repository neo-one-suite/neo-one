import * as path from 'path';
import webpack from 'webpack';
// @ts-ignore
import WebpackBar from 'webpackbar';
import yargs from 'yargs';

yargs.describe('watch', 'Run in watch mode.').default('watch', false);

const compile = async () => {
  const config: webpack.Configuration = {
    mode: 'development',
    entry: {
      sw: path.resolve(__dirname, '..', 'src', 'sw.js'),
    },
    output: {
      path: path.resolve(__dirname, '..', '..', '..', 'dist', 'website'),
      filename: '[name].js',
      chunkFilename: '[name].js',
    },
    plugins: [new WebpackBar({ profile: true })],
  };

  const compiler = webpack(config);

  return yargs.argv.watch
    ? compiler.watch({}, () => undefined)
    : new Promise<undefined>((resolve, reject) =>
        compiler.run((error: Error | undefined, stats) => {
          if (error) {
            reject(error);
          } else if (stats.hasErrors()) {
            reject(new Error('Compilation failed'));
          } else {
            resolve();
          }
        }),
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
    const watcher = await compile();
    const exit = (code: number) => {
      if (watcher !== undefined) {
        watcher.close(() => process.exit(code));
      }
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
