import { loadConfiguration } from '@neo-one/cli-common-node';
import { cliLogger } from '@neo-one/logger';
import { Configuration, Disposable, noopDisposable } from '@neo-one/utils';
import { Command } from '../types';
import { logError } from './logError';

interface StartReturn {
  readonly disposable?: Disposable;
  readonly exitCode?: number;
}

type StartFunc = (cmd: Command, config: Configuration) => Promise<StartReturn | Disposable | number | undefined | void>;

export const start = (startFunc: StartFunc) => {
  // tslint:disable-next-line no-object-mutation
  cliLogger.level = 'info';

  const mutableShutdownFuncs: Array<() => Promise<void> | void> = [];
  const initiateShutdown = async () => {
    await Promise.all(
      mutableShutdownFuncs.map(async (func) => {
        try {
          await func();
        } catch (err) {
          cliLogger.error({ name: 'shutdown_error', err });
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
          logError(err);
          process.exit(1);
        });
    }
  };

  process.on('uncaughtException', (err) => {
    logError(err);
    shutdown(1);
  });

  process.on('unhandledRejection', (err) => {
    logError(err instanceof Error ? err : new Error(String(err)));
  });

  process.on('SIGINT', () => {
    shutdown(0);
  });

  process.on('SIGTERM', () => {
    shutdown(0);
  });

  const cmd = {
    bin: process.argv[0],
    args: [process.argv[1]],
  };

  try {
    loadConfiguration()
      .then((config) =>
        startFunc(cmd, config).then((result) => {
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
        }),
      )
      .catch((error) => {
        logError(error);
        shutdown(1);
      });
  } catch (error) {
    logError(error);
    shutdown(1);
  }
};
