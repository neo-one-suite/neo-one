// @ts-ignore
import history from 'connect-history-api-fallback';
import execa from 'execa';
// @ts-ignore
import convert from 'koa-connect';
import * as nodePath from 'path';
import webpack from 'webpack';
// @ts-ignore
import serve from 'webpack-serve';
import yargs from 'yargs';
import { createKillProcess } from './createKillProcess';
import { overlay, preview, server, SERVER_DIST_DIR, testRunner, tools, workers } from './webpack';

const argv = yargs
  .boolean('watch')
  .describe('watch', 'Run in watch mode.')
  .default('watch', false)
  .string('bundle')
  .describe('bundle', 'Bundle to compile.')
  .default('bundle', 'react-static').argv;

const devStage = process.env.NEO_ONE_PROD === 'true' ? 'prod' : 'dev';

const createDispose = (watcher: webpack.Compiler.Watching): (() => Promise<void>) => async () =>
  new Promise<void>((resolve) => watcher.close(resolve));
const watchConfig = (config: webpack.Configuration): (() => Promise<void>) =>
  createDispose(webpack(config).watch({}, () => undefined));
const watchWorkers = () => watchConfig(workers({ stage: devStage }));
const watchOverlay = () => watchConfig(overlay({ stage: devStage }));
const watchTools = () => watchConfig(tools({ stage: devStage }));
const watchWindow = async (config: webpack.Configuration, port: number) => {
  const { app } = await serve(
    {},
    {
      config,
      open: false,
      hotClient: false,
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
      port,
    },
  );

  return async () =>
    new Promise<void>((resolve) => {
      app.stop(resolve);
    });
};
const watchPreview = async () => watchWindow(preview({ stage: devStage }), 8080);
const watchTestRunner = async () => watchWindow(testRunner({ stage: devStage }), 8081);
const watchServer = async () => {
  const stop = watchConfig(server({ stage: devStage }));
  // tslint:disable-next-line:no-require-imports
  const nodemon = require('nodemon');

  nodemon({
    script: nodePath.resolve(SERVER_DIST_DIR, 'index.js'),
  });

  nodemon
    .on('start', () => {
      log('App has started');
    })
    .on('quit', () => {
      log('App has quit');
    })
    .on('restart', (files: ReadonlyArray<string>) => {
      log(`App restarted due to: ${JSON.stringify(files)}`);
    });

  return async () => {
    await stop();
    await new Promise<void>((resolve) => {
      nodemon.reset(resolve);
    });
  };
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
const compileTools = async () => compileConfig(tools({ stage: 'prod' }));
const compileWorkers = async () => compileConfig(workers({ stage: 'prod' }));
const compileTestRunner = async () => compileConfig(testRunner({ stage: 'prod' }));
const compileOverlay = async () => compileConfig(overlay({ stage: 'prod' }));
const compileServer = async () => compileConfig(server({ stage: 'prod' }));

const startReactStatic = () => {
  const proc = execa('react-static', ['start']);

  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);

  return createKillProcess(proc);
};

const createWatch = async (bundle: string) => {
  switch (bundle) {
    case 'react-static':
      return startReactStatic();
    case 'workers':
      return watchWorkers();
    case 'preview':
      return watchPreview();
    case 'overlay':
      return watchOverlay();
    case 'server':
      return watchServer();
    case 'testRunner':
      return watchTestRunner();
    case 'tools':
      return watchTools();
    default:
      throw new Error(`Unknown bundle: ${bundle}`);
  }
};

const compile = async (bundle: string) => {
  switch (bundle) {
    case 'workers':
      return compileWorkers();
    case 'preview':
      return compilePreview();
    case 'overlay':
      return compileOverlay();
    case 'server':
      return compileServer();
    case 'testRunner':
      return compileTestRunner();
    case 'tools':
      return compileTools();
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
    if (argv.watch) {
      dispose = await createWatch(argv.bundle);
    } else {
      done = compile(argv.bundle).then(() => {
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
