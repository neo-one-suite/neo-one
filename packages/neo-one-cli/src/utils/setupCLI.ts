// tslint:disable no-object-mutation no-any
import { cliLogger, getFinalLogger } from '@neo-one/logger';
import { finalize } from '@neo-one/utils';
import Vorpal from 'vorpal';

export const setupCLI = ({
  vorpal,
}: {
  readonly vorpal: Vorpal;
}): {
  readonly shutdown: (options: { readonly exitCode: number; readonly error?: Error | undefined }) => void;
  mutableShutdownFuncs: Array<() => Promise<void> | void>;
} => {
  const shutdownFuncs = [async () => new Promise<void>((resolve) => setTimeout(resolve, 500))];

  const initiateShutdown = async () => {
    await Promise.all(shutdownFuncs.map((func) => func()));
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
      const finalLogger = getFinalLogger(cliLogger);
      errorIn
        ? finalLogger.error({ exitCode, error: errorIn.message, stack: errorIn.stack }, 'error, shutting down')
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
    cliLogger.fatal({ title: 'unhandled_rejection', error: error.message }, 'Unhandled rejection. Shutting down.');

    shutdown({ exitCode: 1, error });
  });

  process.on('uncaughtException', (error) => {
    cliLogger.fatal({ title: 'uncaught_exception', error: error.message }, 'Uncaught exception. Shutting down.');

    shutdown({ exitCode: 1, error });
  });

  vorpal.sigint(() => {
    // tslint:disable-next-line no-any
    const ui = vorpal.ui as any;
    if (ui.sigintCalled && Date.now() - ui.sigintTime < 1000) {
      ui.parent.emit('vorpal_exit');
      cliLogger.info({ title: 'sigint' }, 'Exiting...');

      shutdown({ exitCode: 0 });
    } else {
      ui.sigintCalled = false;
      const text = vorpal.ui.input();
      if (!ui.parent) {
        cliLogger.info({ title: 'sigint' }, 'Exiting...');

        shutdown({ exitCode: 0 });
      } else if (ui.parent.session.cancelCommands) {
        ui.imprint();
        ui.submit('');
        ui.parent.session.emit('vorpal_command_cancel');
      } else if (String(text).trim() !== '') {
        ui.imprint();
        ui.submit('');
      } else {
        ui.sigintCalled = true;
        ui.sigintTime = Date.now();
        ui.delimiter(' ');
        ui.submit('');
        ui.log('(^C again to quit)');
      }
    }
  });

  return { shutdown, mutableShutdownFuncs: shutdownFuncs };
};
