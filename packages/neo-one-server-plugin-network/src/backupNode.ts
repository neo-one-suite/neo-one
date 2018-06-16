import { CLIArgs } from '@neo-one/server-plugin';
import { addOptions, processArgs } from './commonBackupNode';

export const backupNode = (cliArgs: CLIArgs) => {
  const { vorpal, shutdown } = cliArgs;
  const command = vorpal.command('backup node <provider> <dataPath>', `Backup a node`).action(async (args) => {
    const result = await processArgs(cliArgs, args);
    if (result !== undefined) {
      const { node, options } = result;
      await node.backup(options);
      shutdown({ exitCode: 0 });
    }
  });
  addOptions(command);
};
