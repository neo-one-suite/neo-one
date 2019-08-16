// tslint:disable no-object-mutation no-any
import { getFinalLogger, nodeLogger } from '@neo-one/logger';
import { FullNode } from '@neo-one/node';
import { finalize } from '@neo-one/utils';
import { getConfiguration } from './utils';

export const startNode = async (): Promise<void> => {
  const configuration = getConfiguration();
  let mutableShutdownFuncs: ReadonlyArray<() => Promise<void>> = [];

  const initiateShutdown = async () => {
    await Promise.all(mutableShutdownFuncs.map(async (func) => func()));
    await finalize.wait();
  };

  // tslint:disable-next-line:no-let
  let shutdownInitiated = false;
  const shutdown = ({
    exitCode,
    error: errorIn,
  }: {
    readonly exitCode: number;
    readonly error?: Error | undefined;
  }) => {
    if (!shutdownInitiated) {
      shutdownInitiated = true;
      const finalLogger = getFinalLogger(nodeLogger);
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
    nodeLogger.fatal({ title: 'unhandled_rejection', error }, 'Unhandled rejection. Shutting down.');
    shutdown({ exitCode: 1, error });
  });

  process.on('uncaughtException', (error) => {
    nodeLogger.fatal({ title: 'uncaught_exception', error }, 'Uncaught exception. Shutting down.');

    shutdown({ exitCode: 1, error });
  });

  process.on('SIGINT', () => {
    nodeLogger.info({ title: 'node_sigint' }, 'Exiting...');

    shutdown({ exitCode: 0 });
  });

  process.on('SIGTERM', () => {
    nodeLogger.info({ title: 'node_sigterm' }, 'Exiting...');

    shutdown({ exitCode: 0 });
  });

  try {
    const fullNode = new FullNode(configuration);

    const stop = fullNode.stop.bind(fullNode);
    mutableShutdownFuncs = mutableShutdownFuncs.concat(stop);

    await fullNode.start();
  } catch (error) {
    nodeLogger.error({ title: 'unexpected_error', error }, 'Unexpected error, failed to start');

    shutdown({ exitCode: 1, error });
  }
};
