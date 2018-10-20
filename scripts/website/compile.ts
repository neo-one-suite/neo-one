// @ts-ignore
import history from 'connect-history-api-fallback';
import execa from 'execa';
// @ts-ignore
import convert from 'koa-connect';
import webpack from 'webpack';
// @ts-ignore
import serve from 'webpack-serve';
import yargs from 'yargs';
import { createKillProcess } from './createKillProcess';
import { Bundle } from './types';
import { overlay, preview, workers } from './webpack';

yargs.describe('watch', 'Run in watch mode.').default('watch', false);
yargs.describe('bundle', 'Bundle to compile.').default('bundle', 'react-static');

const createDispose = (watcher: webpack.Compiler.Watching): (() => Promise<void>) => async () =>
  new Promise<void>((resolve) => watcher.close(resolve));
const watchConfig = (config: webpack.Configuration): (() => Promise<void>) =>
  createDispose(webpack(config).watch({}, () => undefined));
const watchWorkers = () => watchConfig(workers({ stage: 'dev' }));
const watchOverlay = () => watchConfig(overlay({ stage: 'dev' }));
const watchPreview = async () => {
  const webpackConfig = preview({ stage: 'dev' });

  const { app } = await serve(
    {},
    {
      config: webpackConfig,
      open: false,
      hotClient: true,
      // tslint:disable-next-line no-any
      add: (appIn: any) => {
        appIn.use(
          convert(
            history({
              verbose: false,
              htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
              index: '/index.html',
            }),
          ),
        );
      },
    },
  );

  return async () =>
    new Promise<void>((resolve) => {
      app.stop(resolve);
    });
};

const runCompiler = async ({ compiler }: { readonly compiler: webpack.Compiler }): Promise<webpack.Stats> =>
  new Promise<webpack.Stats>((resolve, reject) =>
    compiler.run((error: Error | undefined, stats) => {
      log(
        stats.toString({
          performance: false,
          hash: false,
          timings: true,
          entrypoints: false,
          chunkOrigins: false,
          chunkModules: false,
          colors: true,
        }),
      );
      if (error) {
        reject(error);
      } else if (stats.hasErrors()) {
        reject(new Error('Compilation failed'));
      } else {
        resolve(stats);
      }
    }),
  );
const compileConfig = async (config: webpack.Configuration) => runCompiler({ compiler: webpack(config) });
const compilePreview = async () => compileConfig(preview({ stage: 'prod' }));
const compileWorkers = async () => compileConfig(workers({ stage: 'prod' }));
const compileOverlay = async () => compileConfig(overlay({ stage: 'prod' }));

const startReactStatic = () => {
  const proc = execa('react-static', ['start']);

  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);

  return createKillProcess(proc);
};

const createWatch = async (bundle: Bundle) => {
  switch (bundle) {
    case 'react-static':
      return startReactStatic();
    case 'workers':
      return watchWorkers();
    case 'preview':
      return watchPreview();
    case 'overlay':
      return watchOverlay();
    default:
      throw new Error(`Unknown bundle: ${bundle}`);
  }
};

const compile = async (bundle: Bundle) => {
  switch (bundle) {
    case 'workers':
      return compileWorkers();
    case 'preview':
      return compilePreview();
    case 'overlay':
      return compileOverlay();
    default:
      throw new Error(`Unknown bundle: ${bundle}`);
  }
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
    let dispose: () => Promise<void> = async () => {
      // do nothing
    };
    let done = Promise.resolve();
    if (yargs.argv.watch) {
      dispose = await createWatch(yargs.argv.bundle);
    } else {
      done = compile(yargs.argv.bundle).then(() => {
        // do nothing with stats
      });
    }
    const exit = async (code: number) => {
      try {
        await dispose();
        process.exit(code);
      } catch {
        process.exit(1);
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
      exit(0).catch(() => {
        // do nothing
      });
    });

    process.on('SIGTERM', () => {
      log('Exiting...');
      exit(0).catch(() => {
        // do nothing
      });
    });

    return done;
  })
  .catch((error) => {
    logError(error);
    process.exit(1);
  });
