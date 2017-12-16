/* @flow */
import {
  type CLIArgs,
  getServerPID,
  getServerPIDPath,
  killServer,
} from '@neo-one/server-common';

import { name } from '@neo-one/server';
import ora from 'ora';
import { take } from 'rxjs/operators';

import { setupServer } from '../common';

export default (args: CLIArgs) => {
  const { vorpal } = args;
  vorpal
    .command('stop server', `Stops the ${name.title} server`)
    .action(async () => {
      const spinner = ora(`Shutting down ${name.title} server`).start();
      const { log, serverConfig, shutdown } = setupServer('stopServer', args);

      let pid;
      try {
        const config = await serverConfig.config$.pipe(take(1)).toPromise();
        pid = await getServerPID({
          pidPath: getServerPIDPath({ dataPath: config.paths.data }),
        });
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
          log({ event: 'STOP_SERVER_START' });
          await killServer({ pid });
          log({ event: 'STOP_SERVER_SUCCESS' });
          spinner.succeed(`${name.title} server shutdown (pid=${pid})`);
        } catch (error) {
          log({ event: 'STOP_SERVER_ERROR', error });
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
