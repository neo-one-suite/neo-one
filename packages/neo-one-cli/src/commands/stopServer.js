/* @flow */
import { VERSION } from '@neo-one/server';
import { type CLIArgs, name } from '@neo-one/server-plugin';
import { ServerManager } from '@neo-one/server-client';

import ora from 'ora';
import { take } from 'rxjs/operators';

import { setupServer } from './common';

export default (args: CLIArgs) => {
  const { vorpal } = args;
  vorpal
    .command('stop server', `Stops the ${name.title} server`)
    .action(async () => {
      const spinner = ora(`Shutting down ${name.title} server`).start();
      const { serverConfig, shutdown } = setupServer('stopServer', args);

      let manager;
      let pid;
      try {
        const config = await serverConfig.config$.pipe(take(1)).toPromise();
        manager = new ServerManager({
          dataPath: config.paths.data,
          serverVersion: VERSION,
        });
        pid = await manager.getServerPID();
      } catch (error) {
        spinner.fail(
          `Failed to fetch ${name.title} server pid: ${error.message}`,
        );
        shutdown({ exitCode: 1, error });
        return;
      }

      if (pid == null) {
        spinner.succeed(`${name.title} server is not running`);
      } else {
        spinner.start(`Shutting down ${name.title} server (pid=${pid})`);
        try {
          manager.kill();
          spinner.succeed(`${name.title} server shutdown (pid=${pid})`);
        } catch (error) {
          spinner.fail(
            `Failed to shutdown ${name.title} server (pid=${pid}): ` +
              `${error.message}`,
          );
          shutdown({ exitCode: 1, error });
          return;
        }
      }

      shutdown({ exitCode: 0 });
    });
};
