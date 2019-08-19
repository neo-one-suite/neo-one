import { Disposable, noopDisposable } from '@neo-one/utils';
import P from 'pino';
import { logError } from './logError';

export interface StartReturn {
  readonly disposable?: Disposable;
  readonly exitCode?: number;
}

type StartFunc = () => Promise<StartReturn | Disposable | number | undefined | void>;

export const createStart = (logger: P.Logger) => (startFunc: StartFunc) => {
  const mutableShutdownFuncs: Array<() => Promise<void> | void> = [];
  const initiateShutdown = async () => {
    await Promise.all(
      mutableShutdownFuncs.map(async (func) => {
        try {
          await func();
        } catch (err) {
          logger.error({ name: 'shutdown_error', err });
        }
      }),
    );
  };

  let shutdownInitiated = false;
  const shutdown = (exitCode: number) => {
    if (!shutdownInitiated) {
      shutdownInitiated = true;
      initiateShutdown()
        .then(() => {
          process.exit(exitCode);
        })
        .catch((err) => {
          logError(err, logger);
          process.exit(1);
        });
    }
  };

  process.on('uncaughtException', (err) => {
    logError(err, logger);
    shutdown(1);
  });

  process.on('unhandledRejection', (err) => {
    logError(err instanceof Error ? err : new Error(String(err)), logger);
  });

  process.on('SIGINT', () => {
    shutdown(0);
  });

  process.on('SIGTERM', () => {
    shutdown(0);
  });

  try {
    startFunc()
      .then((result) => {
        let disposable = noopDisposable;
        let exitCode = 0;

        if (typeof result === 'number') {
          exitCode = result;
        }

        if (typeof result === 'function') {
          disposable = result;
        }

        if (typeof result === 'object') {
          if (result.disposable !== undefined) {
            ({ disposable } = result);
          }

          if (result.exitCode !== undefined) {
            ({ exitCode } = result);
          }
        }

        mutableShutdownFuncs.push(disposable);
        // tslint:disable-next-line no-object-mutation
        process.exitCode = exitCode;
      })
      .catch((error) => {
        logError(error, logger);
        shutdown(1);
      });
  } catch (error) {
    logError(error, logger);
    shutdown(1);
  }
};
