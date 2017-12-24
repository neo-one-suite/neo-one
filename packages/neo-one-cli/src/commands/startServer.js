/* @flow */
import { type CLIArgs, name } from '@neo-one/server-plugin';
import { Server } from '@neo-one/server';

import { setupServer } from './common';

export default (args: CLIArgs) => {
  const { vorpal, binary } = args;
  vorpal
    .command('start server', `Starts the ${name.title} server`)
    .action(async () => {
      const { log, serverConfig, shutdown, shutdownFuncs } = setupServer(
        'server',
        args,
      );

      const subscription = Server.init$({
        log: (message, onExit) => {
          if (
            message.event === 'SERVER_START' &&
            message.port != null &&
            typeof message.port === 'number'
          ) {
            (vorpal.activeCommand || vorpal).log(
              `Server listening on port ${message.port}`,
            );
          }
          log(message, onExit);
        },
        serverConfig,
        binary,
      }).subscribe({
        error: error => {
          log({ event: 'UNCAUGHT_SERVER_ERROR', error });
          shutdown({ exitCode: 1, error });
        },
        complete: () => {
          log({ event: 'UNEXPECTED_SERVER_COMPLETE' });
          shutdown({ exitCode: 1 });
        },
      });
      shutdownFuncs.push(() => subscription.unsubscribe());
    });
};
