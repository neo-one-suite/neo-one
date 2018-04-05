/* @flow */
import type Vorpal from 'vorpal';
import type { LogConfig } from '@neo-one/server-plugin';
import type { Monitor } from '@neo-one/monitor';
import type { Subject } from 'rxjs/Subject';

import { finalize } from '@neo-one/utils';

import createMonitor from './createMonitor';

export default ({
  vorpal,
  debug,
  logConsole,
}: {|
  vorpal: Vorpal,
  debug?: boolean,
  logConsole?: boolean,
|}): {|
  monitor: Monitor,
  shutdown: (options: {|
    exitCode: number,
    error?: ?Error,
  |}) => void,
  shutdownFuncs: Array<() => Promise<void> | void>,
  config$: Subject<LogConfig>,
|} => {
  const { monitor, config$, cleanup } = createMonitor({ debug, logConsole });
  const shutdownFuncs = [() => cleanup()];

  const initiateShutdown = async () => {
    await Promise.all(shutdownFuncs.map(func => func()));
    await finalize.wait();
  };

  let shutdownInitiated = false;
  const shutdown = ({
    exitCode: exitCodeIn,
    error,
  }: {|
    exitCode: number,
    error?: ?Error,
  |}) => {
    const exitCode =
      error != null &&
      (error: $FlowFixMe).exitCode != null &&
      typeof (error: $FlowFixMe).exitCode === 'number'
        ? (error: $FlowFixMe).exitCode
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

  process.on('unhandledRejection', error => {
    monitor.logError({
      name: 'unhandled_rejection',
      message: 'Unhandled rejection. Shutting down.',
      error,
    });
    shutdown({ exitCode: 1, error });
  });

  process.on('uncaughtException', error => {
    monitor.logError({
      name: 'uncaught_exception',
      message: 'Uncaught exception. Shutting down.',
      error,
    });
    shutdown({ exitCode: 1, error });
  });

  vorpal.sigint(() => {
    const ui = (vorpal.ui: $FlowFixMe);
    if (ui._sigintCount > 1) {
      ui.parent.emit('vorpal_exit');
      monitor.log({
        name: 'sigint',
        message: 'Exiting...',
      });
      shutdown({ exitCode: 0 });
    } else {
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
        ui._sigintCalled = false;
        ui._sigintCount = 0;
        ui.parent.session.emit('vorpal_command_cancel');
      } else if (String(text).trim() !== '') {
        ui.imprint();
        ui.submit('');
        ui._sigintCalled = false;
        ui._sigintCount = 0;
      } else {
        ui._sigintCalled = false;
        ui.delimiter(' ');
        ui.submit('');
        ui.log('(^C again to quit)');
      }
    }
  });

  return { monitor, shutdown, config$, shutdownFuncs };
};
