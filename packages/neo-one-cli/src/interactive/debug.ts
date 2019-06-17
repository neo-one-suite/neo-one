import { name } from '@neo-one/server-plugin';
import { InteractiveCLI } from '../InteractiveCLI';

export const debug = (cli: InteractiveCLI) => {
  cli.vorpal
    .command('debug', `Prints ${name.title} debug information.`)
    .action(async () => {
      const [version, dbg] = await Promise.all([cli.client.getVersion(), cli.client.getDebug()]);

      const table = cli
        .getDebug()
        .concat([['Server Version', version] as const])
        .concat(dbg);
      cli.printDescribe(table);
    })
    .hidden();
};
