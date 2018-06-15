import { InteractiveCLIArgs } from '@neo-one/server-plugin';
import { constants } from './constants';
import { NetworkPlugin } from './NetworkPlugin';

export const deactivateNetwork = (plugin: NetworkPlugin) => ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal
    .command(
      'deactivate network',
      'Deactivates the currently active Network, removing it as the default ' + 'network for other commands.',
    )
    .alias('deactivate net')
    .action(async () => {
      cli.mergeSession(plugin.name, { network: undefined });
      cli.removeDelimiter(constants.DELIMITER_KEY);
    });
