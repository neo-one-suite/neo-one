import { cliLogger } from '@neo-one/logger';
import { Server } from '@neo-one/server';
import { CLIArgs, name } from '@neo-one/server-plugin';
import { setupServer } from './common';

export const startServer = (args: CLIArgs) => {
  const { vorpal, binary } = args;
  vorpal.command('start server', `Starts the ${name.title} server`).action(async () => {
    const { serverConfig, shutdown, mutableShutdownFuncs } = setupServer(args);

    const subscription = Server.init$({
      serverConfig,
      binary,
    }).subscribe({
      error: (error) => {
        cliLogger.error(
          { title: 'server_uncaught_error', error: error.message },
          'Uncaught server error. Shutting down.',
        );

        shutdown({ exitCode: 1, error });
      },
      complete: () => {
        cliLogger.error({ title: 'server_uncaught_complete' }, 'Something went wrong. Shutting down.');

        shutdown({ exitCode: 1 });
      },
    });
    mutableShutdownFuncs.push(() => subscription.unsubscribe());
  });
};
