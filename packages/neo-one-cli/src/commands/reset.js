/* @flow */
import { VERSION } from '@neo-one/server';
import { type CLIArgs, name } from '@neo-one/server-plugin';
import { Client, ServerManager } from '@neo-one/server-client';

import fs from 'fs-extra';
import ora from 'ora';
import { take } from 'rxjs/operators';

import { setupServer } from './common';

export default (args: CLIArgs) => {
  const { vorpal } = args;
  vorpal
    .command('reset', `Resets all data paths and starts ${name.title} fresh.`)
    .action(async () => {
      const spinner = ora(`Shutting down ${name.title} server`).start();
      const { serverConfig, shutdown } = setupServer('reset', args);
      const config = await serverConfig.config$.pipe(take(1)).toPromise();
      const manager = new ServerManager({
        dataPath: config.paths.data,
        serverVersion: VERSION,
      });
      const pid = await manager.checkAlive(config.server.port);
      if (pid != null) {
        const client = new Client({ port: config.server.port });
        await client.reset();
        await manager.kill();
      }

      spinner.succeed(`${name.title} server shutdown`);

      spinner.start('Removing data directories');
      await Promise.all([
        fs.remove(config.paths.data),
        fs.remove(config.paths.config),
        fs.remove(config.paths.cache),
        fs.remove(config.paths.temp),
      ]);
      spinner.succeed('Nuked everything');

      shutdown({ exitCode: 0 });
    })
    .hidden();
};
