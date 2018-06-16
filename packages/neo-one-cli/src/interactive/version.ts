import { name } from '@neo-one/server-plugin';
import { InteractiveCLI } from '../InteractiveCLI';

export const version = (cli: InteractiveCLI) => {
  cli.vorpal.command('version', `Prints the ${name.title} version.`).action(async () => {
    const versionInternal = await cli.client.getVersion();
    cli.vorpal.activeCommand.log(`v${versionInternal}`);
  });
};
