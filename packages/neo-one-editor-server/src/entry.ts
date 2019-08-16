import { bodyParser, context, cors, onError as appOnError, setupServer } from '@neo-one/http';
import { editorLogger, getFinalLogger } from '@neo-one/logger';
import { Disposable, finalize, mergeScanLatest } from '@neo-one/utils';
import * as http from 'http';
import Application from 'koa';
import compose from 'koa-compose';
import koaCompress from 'koa-compress';
import Router from 'koa-router';
import { BehaviorSubject } from 'rxjs';
import { pkgMiddleware } from './pkgMiddleware';
import { resolveMiddleware } from './resolveMiddleware';

const mutableShutdownFuncs: Array<() => Promise<void>> = [];

const initiateShutdown = async () => {
  await Promise.all(mutableShutdownFuncs.map((func) => func()));
  await finalize.wait();
};

// tslint:disable-next-line:no-let
let shutdownInitiated = false;
const shutdown = ({ exitCode, error: errorIn }: { readonly exitCode: number; readonly error?: Error | undefined }) => {
  if (!shutdownInitiated) {
    shutdownInitiated = true;
    const finalLogger = getFinalLogger(editorLogger);
    errorIn
      ? finalLogger.error({ exitCode, error: errorIn }, 'error, shutting down')
      : finalLogger.info({ exitCode }, 'shutting down');

    initiateShutdown()
      .then(() => {
        finalLogger.info({ exitCode }, 'shutdown');
        process.exit(exitCode);
      })
      .catch((error) => {
        finalLogger.error({ exitCode, err: error }, 'shutdown (error)');
        process.exit(1);
      });
  }
};

process.on('unhandledRejection', (errorIn) => {
  const error = errorIn as Error;
  editorLogger.fatal({ title: 'unhandled_rejection', error: error.message }, 'Unhandled rejection. Shutting down.');
  shutdown({ exitCode: 1, error });
});

process.on('uncaughtException', (error) => {
  editorLogger.fatal({ title: 'uncaught_exception', error: error.message }, 'Uncaught exception. Shutting down.');

  shutdown({ exitCode: 1, error });
});

// tslint:disable-next-line:no-any
const app = new Application<any, {}>();
app.proxy = true;
app.silent = true;

app.on('error', appOnError(editorLogger));

// tslint:disable-next-line:no-any
const router = new Router<any, {}>();

router.use(context(editorLogger));
router.use(cors).post('resolveDependencies', '/resolve', compose([koaCompress(), bodyParser(), resolveMiddleware]));
router.use(cors).get('resolvePackage', '/pkg', compose([koaCompress(), pkgMiddleware]));

app.use(router.routes());
app.use(cors);
app.use(router.allowedMethods());

const app$ = new BehaviorSubject(app);

const subscription = app$
  .pipe(
    mergeScanLatest(async (disposable: Disposable | undefined, appInternal) => {
      if (disposable !== undefined) {
        await disposable();
      }

      return setupServer(appInternal, http.createServer(), '0.0.0.0', 3001);
    }),
    finalize(async (disposable) => {
      if (disposable !== undefined) {
        await disposable();
      }
    }),
  )
  .subscribe({
    error: (error) => {
      editorLogger.error(
        { title: 'uncaught_server_exception', error: error.message },
        'Uncaught exception. Shutting down.',
      );

      shutdown({ exitCode: 1, error });
    },
    complete: () => {
      editorLogger.error(
        { title: 'uncaught_server_complete', error: new Error('Unexpected complete') },
        'Unexpected complete. Shutting down.',
      );

      shutdown({ exitCode: 1 });
    },
  });
mutableShutdownFuncs.push(async () => subscription.unsubscribe());
