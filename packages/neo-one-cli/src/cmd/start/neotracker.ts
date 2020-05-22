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
      '--dbFileName',
      nodePath.resolve(config.neotracker.path, 'db.sqlite'),
    ];
    const proc = execa(
      nodePath.resolve(require.resolve('@neotracker/core/bin'), '../', 'neotracker'),
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
