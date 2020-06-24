import { cliLogger } from '@neo-one/logger';
import { Yarguments } from '@neo-one/utils-node';
import execa from 'execa';
import * as nodePath from 'path';
import yargs from 'yargs';
import { isRunning, start } from '../../common';
import { findKillProcess } from '../../utils';
import { writePidFile } from './writePidFile';

export const command = 'neotracker';
export const describe = 'Start a NEO Tracker instance using the project configuration.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder.boolean('reset').describe('reset', 'Reset the NEO Tracker database.').default('reset', false);
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (_cmd, config) => {
    const running = await isRunning(config.neotracker.port);
    if (running) {
      if (argv.reset) {
        await findKillProcess('neotracker', config);
      } else {
        cliLogger.info('NEO Tracker is already running');

        return undefined;
      }
    }

    const args = [
      'neotracker',
      '--port',
      `${config.neotracker.port}`,
      '--nodeRpcUrl',
      `http://localhost:${config.network.port}/rpc`,
      '--client',
      'sqlite',
      '--db.connection.filename',
      nodePath.resolve(config.neotracker.path, 'db.sqlite'),
    ];
    let neotrackerBinPath: string;
    try {
      neotrackerBinPath = require.resolve('@neotracker/core/bin');
    } catch {
      throw new Error(
        '@neotracker/core not found. Try adding the @neotracker/core dependency to your ' +
          'project with `yarn add @neotracker/core` or `npm install @neotracker/core`',
      );
    }
    const proc = execa(
      nodePath.resolve(neotrackerBinPath, '../', 'neotracker'),
      argv.reset ? args.concat(['--resetDB']) : args,
      {
        cleanup: false,
        stdio: 'ignore',
      },
    );
    proc.unref();

    await writePidFile('neotracker', proc, config);

    return async () => {
      proc.kill();
    };
  });
};
