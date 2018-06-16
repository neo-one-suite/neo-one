import { InteractiveCLIArgs } from '@neo-one/server-plugin';
import { constants } from './constants';
import { WalletPlugin } from './WalletPlugin';

export const deactivateWallet = (plugin: WalletPlugin) => ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal
    .command(
      'deactivate wallet',
      'Deactivates the currently active Wallet, removing it as the default ' + 'wallet for other commands.',
    )
    .action(async () => {
      cli.mergeSession(plugin.name, { wallet: undefined });
      cli.removeDelimiter(constants.DELIMITER_KEY);
    });
