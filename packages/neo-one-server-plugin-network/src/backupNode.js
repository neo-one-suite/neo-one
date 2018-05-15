/* @flow */
import type { CLIArgs } from '@neo-one/server-plugin';

import { addOptions, processArgs } from './commonBackupNode';

export default (cliArgs: CLIArgs) => {
  const { vorpal, shutdown } = cliArgs;
  const command = vorpal
    .command('backup node <provider> <dataPath>', `Backup a node`)
    .action(async (args) => {
      const result = await processArgs(cliArgs, args);
      if (result != null) {
        const { node, options } = result;
        await node.backup(options);
        shutdown({ exitCode: 0 });
      }
    });
  addOptions(command);
};
