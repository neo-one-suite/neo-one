import { CLIArgs } from '@neo-one/server-plugin';
import { addOptions, processArgs } from './commonBackupNode';

export const restoreNode = (cliArgs: CLIArgs) => {
  const { vorpal, shutdown } = cliArgs;
  // tslint:disable-next-line no-any
  const command = vorpal.command('restore node <provider> <dataPath>', `Backup a node`).action(async (args: any) => {
    const result = await processArgs(cliArgs, args);
    if (result !== undefined) {
      const { node, options } = result;
      await node.restore(options);
      shutdown({ exitCode: 0 });
    }
  });
  addOptions(command);
};
