/* @flow */
import type Vorpal from 'vorpal';
import { type Log, finalize } from '@neo-one/utils';
import type { LogConfig } from '@neo-one/server-plugin';
import type { Subject } from 'rxjs/Subject';

import createLog from './createLog';

export default ({
  vorpal,
  debug,
  logConsole,
}: {|
  vorpal: Vorpal,
  debug?: boolean,
  logConsole?: boolean,
|}): {|
  log: Log,
  shutdown: (options: {|
    exitCode: number,
    error?: ?Error,
  |}) => void,
  shutdownFuncs: Array<() => Promise<void> | void>,
  config$: Subject<LogConfig>,
|} => {
  const { log, config$, cleanup } = createLog({ debug, logConsole });
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
      error.exitCode != null &&
      typeof error.exitCode === 'number'
        ? error.exitCode
        : exitCodeIn;
    if (!shutdownInitiated) {
      shutdownInitiated = true;
      initiateShutdown()
        .then(() => {
          log({ event: 'SHUTDOWN_SUCCESS' }, () => {
            process.exit(exitCode);
          });
        })
        .catch(shutdownError => {
          log({ event: 'SHUTDOWN_ERROR', error: shutdownError }, () =>
            process.exit(exitCode > 0 ? exitCode : 1),
          );
        });
    }
  };

  process.on('unhandledRejection', error => {
    log({ event: 'UNHANDLED_REJECTION.', error });
    shutdown({ exitCode: 1, error });
  });

  process.on('uncaughtException', error => {
    log({ event: 'UNCAUGHT_EXCEPTION', error });
    shutdown({ exitCode: 1, error });
  });

  vorpal.sigint(() => {
    const ui = (vorpal.ui: $FlowFixMe);
    if (ui._sigintCount > 1) {
      ui.parent.emit('vorpal_exit');
      log({ event: 'SIGINT' });
      shutdown({ exitCode: 0 });
    } else {
      const text = vorpal.ui.input();
      if (!ui.parent) {
        log({ event: 'SIGINT' });
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

  return { log, shutdown, config$, shutdownFuncs };
};
