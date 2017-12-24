/* @flow */
import type { InteractiveCLIArgs } from '@neo-one/server-plugin';

import { take } from 'rxjs/operators';

import type NetworkPlugin from './NetworkPlugin';

import constants from './constants';

export default (plugin: NetworkPlugin) => ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal
    .command(
      'activate network <name>',
      'Activates Network <name>, setting it as the default network for ' +
        'other commands.',
    )
    .alias('activate net')
    .autocomplete({
      data: async () =>
        plugin.networkResourceType
          .getCRUD()
          .describe.getCLIAutocomplete({ cli }),
    })
    .action(async args => {
      const resource = await plugin.networkResourceType
        .getResource$({
          name: args.name,
          client: cli.client,
          options: {},
        })
        .pipe(take(1))
        .toPromise();
      if (resource == null) {
        throw new Error(`Network ${args.name} does not exist.`);
      }

      cli.mergeSession(plugin.name, { network: args.name });
      cli.addDelimiter(constants.DELIMITER_KEY, args.name);
    });
