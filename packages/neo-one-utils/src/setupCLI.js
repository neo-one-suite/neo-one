/* @flow */
import type { Log } from './log';

import finalize from './finalize';

// TODO: Delete
export default ({
  log,
  shutdownFuncs,
  disableSIGINT,
}: {|
  log: Log,
  shutdownFuncs: Array<() => Promise<void> | void>,
  disableSIGINT?: boolean,
|}) => {
  const initiateShutdown = async () => {
    await Promise.all(shutdownFuncs.map(func => func()));
    await finalize.wait();
  };

  let shutdownInitiated = false;
  const shutdown = (exitCode: number) => {
    if (!shutdownInitiated) {
      shutdownInitiated = true;
      initiateShutdown()
        .then(() => {
          log({ event: 'SHUTDOWN_SUCCESS' }, () => process.exit(exitCode));
        })
        .catch(error => {
          log(
            {
              event: 'SHUTDOWN_ERROR',
              message: `Encountered error while shutting down: ${
                error.message
              }`,
              error,
            },
            () => process.exit(1),
          );
        });
    }
  };

  process.on('unhandledRejection', error => {
    log({
      event: 'UNHANDLED_REJECTION.',
      message: `Something went wrong... Hit an unhandled rejection: ${
        error.message
      }`,
      error,
    });
    shutdown(1);
  });

  process.on('uncaughtException', error => {
    log({
      event: 'UNCAUGHT_EXCEPTION',
      message: `Something went wrong... Hit an uncaught exception: ${
        error.message
      }`,
      error,
    });
    shutdown(1);
  });

  if (!disableSIGINT) {
    process.on('SIGINT', () => {
      log({ event: 'SIGINT', message: 'Exiting...' });
      shutdown(0);
    });
  }

  process.on('SIGTERM', () => {
    log({ event: 'SIGTERM', message: 'Exiting...' });
    shutdown(0);
  });

  return shutdown;
};
