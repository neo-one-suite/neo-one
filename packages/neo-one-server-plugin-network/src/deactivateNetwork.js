/* @flow */
import type { InteractiveCLIArgs } from '@neo-one/server-plugin';

import type NetworkPlugin from './NetworkPlugin';

import constants from './constants';

export default (plugin: NetworkPlugin) => ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal
    .command(
      'deactivate network',
      'Deactivates the currently active Network, removing it as the default ' +
        'network for other commands.',
    )
    .alias('deactivate net')
    .action(async () => {
      cli.mergeSession(plugin.name, { network: undefined });
      cli.removeDelimiter(constants.DELIMITER_KEY);
    });
