/* @flow */
import { VERSION } from '@neo-one/server';
import { type CLIArgs, name } from '@neo-one/server-plugin';
import { ServerManager } from '@neo-one/server-client';

import fs from 'fs-extra';
import ora from 'ora';
import { take } from 'rxjs/operators';
import { utils } from '@neo-one/utils';

import { setupServer } from './common';

export default (args: CLIArgs) => {
  const { vorpal } = args;
  vorpal
    .command('nuke', `Resets all data paths and starts ${name.title} fresh.`)
    .action(async () => {
      const { serverConfig, shutdown } = setupServer('nuke', args);
      const spinner = ora(`Shutting down ${name.title} server`).start();
      const config = await serverConfig.config$.pipe(take(1)).toPromise();
      const manager = new ServerManager({
        dataPath: config.paths.data,
        serverVersion: VERSION,
      });
      await manager.kill();

      spinner.succeed(`${name.title} server shutdown`);

      spinner.start('Removing data directories');
      await Promise.all(utils.values(config.paths).map(dir => fs.remove(dir)));
      spinner.succeed('Nuked everything');

      shutdown({ exitCode: 0 });
    })
    .hidden();
};
