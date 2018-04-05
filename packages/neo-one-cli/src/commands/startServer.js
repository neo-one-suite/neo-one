/* @flow */
import { type CLIArgs, name } from '@neo-one/server-plugin';
import { Server } from '@neo-one/server';

import { setupServer } from './common';

export default (args: CLIArgs) => {
  const { vorpal, binary } = args;
  vorpal
    .command('start server', `Starts the ${name.title} server`)
    .action(async () => {
      const { monitor, serverConfig, shutdown, shutdownFuncs } = setupServer(
        'server',
        args,
      );

      const subscription = Server.init$({
        monitor,
        serverConfig,
        binary,
      }).subscribe({
        error: error => {
          monitor.logError({
            name: 'server_uncaught_error',
            message: 'Uncaught server error. Shutting down.',
            error,
          });
          shutdown({ exitCode: 1, error });
        },
        complete: () => {
          monitor.log({
            name: 'server_uncaught_complete',
            message: 'Something went wrong. Shutting down.',
            level: 'error',
          });
          shutdown({ exitCode: 1 });
        },
      });
      shutdownFuncs.push(() => subscription.unsubscribe());
    });
};
