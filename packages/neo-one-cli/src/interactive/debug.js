/* @flow */
import { name } from '@neo-one/server-plugin';

import type InteractiveCLI from '../InteractiveCLI';

export default (cli: InteractiveCLI) => {
  cli.vorpal
    .command('debug', `Prints ${name.title} debug information.`)
    .action(async () => {
      const [version, debug] = await Promise.all([
        cli.client.getVersion(),
        cli.client.getDebug(),
      ]);
      const table = cli
        .getDebug()
        .concat([['Server Version', version]])
        .concat(debug);
      cli.printDescribe(table);
    })
    .hidden();
};
