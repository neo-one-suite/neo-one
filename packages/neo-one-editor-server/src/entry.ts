import { bodyParser, context, cors, createServer$, getMonitor, onError as appOnError } from '@neo-one/http';
import { DefaultMonitor } from '@neo-one/monitor';
import { finalize } from '@neo-one/utils';
import * as http from 'http';
import Application, { Context } from 'koa';
import compose from 'koa-compose';
import compress from 'koa-compress';
import Router from 'koa-router';
import { BehaviorSubject } from 'rxjs';
import { resolveDependencies } from './resolveDependencies';
import { resolvePackage } from './resolvePackage';

const monitor = DefaultMonitor.create({
  service: 'editor-server',
  logger: {
    log: (options) => {
      if (
        process.env.NODE_ENV !== 'production' ||
        options.level === 'error' ||
        options.level === 'warn' ||
        options.level === 'info'
      ) {
        if (options.level === 'error') {
          const { error, ...otherOptions } = options;
          // tslint:disable-next-line no-console
          console.error(error);
          // tslint:disable-next-line no-console
          console.log(otherOptions);
        } else {
          // tslint:disable-next-line no-console
          console.log(options);
        }
      }
    },
    close: () => {
      // do nothing
    },
  },
});

const mutableShudownFuncs: Array<() => Promise<void>> = [];

const initiateShutdown = async () => {
  await Promise.all(mutableShudownFuncs.map(async (func) => func()));
  await finalize.wait();
};

// tslint:disable-next-line no-let
let shutdownInitiated = false;
const shutdown = ({
  exitCode: exitCodeIn,
  error,
}: {
  readonly exitCode: number;
  readonly error?: Error | undefined;
}) => {
  const exitCode =
    // tslint:disable-next-line no-any
    error !== undefined && (error as any).exitCode != undefined && typeof (error as any).exitCode === 'number'
      ? // tslint:disable-next-line no-any
        (error as any).exitCode
      : exitCodeIn;
  if (!shutdownInitiated) {
    shutdownInitiated = true;
    monitor
      .captureLog(initiateShutdown, {
        name: 'cli_shutdown',
        message: 'Shutdown cleanly.',
        error: 'Failed to shutdown cleanly',
      })
      .then(() => {
        monitor.close(() => {
          process.exit(exitCode);
        });
      })
      .catch(() => {
        monitor.close(() => {
          process.exit(exitCode > 0 ? exitCode : 1);
        });
      });
  }
};

process.on('unhandledRejection', (error) => {
  monitor.logError({
    name: 'unhandled_rejection',
    message: 'Unhandled rejection. Shutting down.',
    error,
  });

  shutdown({ exitCode: 1, error });
});

process.on('uncaughtException', (error) => {
  monitor.logError({
    name: 'uncaught_exception',
    message: 'Uncaught exception. Shutting down.',
    error,
  });

  shutdown({ exitCode: 1, error });
});

const app = new Application();
app.proxy = true;
// $FlowFixMe
app.silent = true;

app.on('error', appOnError({ monitor }));

const router = new Router();

router.use(context({ monitor }));
router.use(cors).post(
  'resolveDependencies',
  '/resolve',
  compose([
    compress(),
    bodyParser(),
    async (ctx: Context): Promise<void> => {
      if (!ctx.is('application/json')) {
        ctx.throw(415);

        return;
      }

      // tslint:disable-next-line no-any
      const { body } = ctx.request as any;
      const result = await resolveDependencies(body, getMonitor(ctx));

      ctx.body = result;
    },
  ]),
);
router.use(cors).get(
  'resolvePackage',
  '/pkg/:pkg/:version',
  compose([
    compress(),
    async (ctx: Context): Promise<void> => {
      const result = await resolvePackage(ctx.params.pkg, ctx.params.version, getMonitor(ctx));

      const directives = [`max-age=${365 * 24 * 60 * 60}`, 'immutable', 'public'];
      ctx.set('Cache-Control', directives.join(', '));
      ctx.body = result;
    },
  ]),
);

app.use(router.routes());
app.use(cors);
app.use(router.allowedMethods());

const app$ = new BehaviorSubject(app);
const keepAliveTimeout$ = new BehaviorSubject(undefined);

const susbcription = createServer$(monitor, app$, keepAliveTimeout$, { host: '0.0.0.0', port: 3001 }, () =>
  http.createServer(),
).subscribe({
  error: (error) => {
    monitor.logError({
      name: 'uncaught_server_exception',
      message: 'Uncaught exception. Shutting down.',
      error,
    });

    shutdown({ exitCode: 1, error });
  },
  complete: () => {
    monitor.logError({
      name: 'uncaught_server_complete',
      message: 'Unexpected complete. Shutting down.',
      error: new Error('Unexpected complete'),
    });

    shutdown({ exitCode: 1 });
  },
});
mutableShudownFuncs.push(async () => susbcription.unsubscribe());
