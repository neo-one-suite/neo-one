// tslint:disable no-object-mutation no-any
import { Monitor } from '@neo-one/monitor';
import { LogConfig } from '@neo-one/server-plugin';
import { finalize } from '@neo-one/utils';
import { Subject } from 'rxjs';
import Vorpal from 'vorpal';
import { createMonitor } from './createMonitor';

export const setupCLI = ({
  vorpal,
  debug,
  logConsole,
}: {
  readonly vorpal: Vorpal;
  readonly debug?: boolean;
  readonly logConsole?: boolean;
}): {
  readonly monitor: Monitor;
  readonly shutdown: (options: { readonly exitCode: number; readonly error?: Error | undefined }) => void;

  mutableShutdownFuncs: (() => Promise<void> | void)[];
  readonly config$: Subject<LogConfig>;
} => {
  const { monitor, config$, cleanup } = createMonitor({ debug, logConsole });
  const shutdownFuncs = [cleanup];

  const initiateShutdown = async () => {
    await Promise.all(shutdownFuncs.map((func) => func()));
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

  process.on('unhandledRejection', (errorIn) => {
    const error = errorIn as Error;
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

  vorpal.sigint(() => {
    // tslint:disable-next-line no-any
    const ui = vorpal.ui as any;
    if (ui.sigintCalled && Date.now() - ui.sigintTime < 1000) {
      ui.parent.emit('vorpal_exit');
      monitor.log({
        name: 'sigint',
        message: 'Exiting...',
      });

      shutdown({ exitCode: 0 });
    } else {
      ui.sigintCalled = false;
      const text = vorpal.ui.input();
      if (!ui.parent) {
        monitor.log({
          name: 'sigint',
          message: 'Exiting...',
        });

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

  return { monitor, shutdown, config$, mutableShutdownFuncs: shutdownFuncs };
};
