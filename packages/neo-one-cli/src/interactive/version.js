/* @flow */
import { name } from '@neo-one/server-plugin';

import type InteractiveCLI from '../InteractiveCLI';

export default (cli: InteractiveCLI) => {
  cli.vorpal
    .command('version', `Prints the ${name.title} version.`)
    .action(async () => {
      const version = await cli.client.getVersion();
      cli.vorpal.activeCommand.log(`v${version}`);
    });
};
