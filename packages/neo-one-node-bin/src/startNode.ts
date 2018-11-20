// tslint:disable no-object-mutation no-any
import { FullNode, FullNodeEnvironment } from '@neo-one/node';
import { createTest } from '@neo-one/node-neo-settings';
import { finalize } from '@neo-one/utils';
import { of as _of } from 'rxjs';
import { createMonitor } from './createMonitor';

const createRPCEnvironment = () => ({
  http: {
    port: 8080,
    host: 'localhost',
  },
});

const createDataPath = () => './neo-one-node';

const createEnvironment = (options: Partial<FullNodeEnvironment> = {}): FullNodeEnvironment => ({
  dataPath: createDataPath(),
  rpc: createRPCEnvironment(),
  ...options,
});

export const startNode = async (): Promise<void> => {
  const monitor = createMonitor();
  let mutableShutdownFuncs: ReadonlyArray<() => Promise<void>> = [];

  const initiateShutdown = async () => {
    await Promise.all(mutableShutdownFuncs.map(async (func) => func()));
    await finalize.wait();
  };

  let shutdownInitiated = false;
  const shutdown = ({ exitCode: exitCodeIn, error }: { exitCode: number; error?: Error | undefined }) => {
    const exitCode =
      error !== undefined && (error as any).exitCode != undefined && typeof (error as any).exitCode === 'number'
        ? (error as any).exitCode
        : exitCodeIn;
    if (!shutdownInitiated) {
      shutdownInitiated = true;
      monitor
        .captureLog(initiateShutdown, {
          name: 'node_shutdown',
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

  process.on('SIGINT', () => {
    monitor.log({
      name: 'node_sigint',
      message: 'Exiting...',
    });

    shutdown({ exitCode: 0 });
  });

  process.on('SIGTERM', () => {
    monitor.log({
      name: 'node_sigterm',
      message: 'Exiting...',
    });

    shutdown({ exitCode: 0 });
  });

  const fullNode = new FullNode({
    monitor,
    environment: createEnvironment(),
    settings: createTest(),
    options$: _of({}),
  });

  mutableShutdownFuncs = mutableShutdownFuncs.concat(fullNode.stop);

  await fullNode.start();
};
