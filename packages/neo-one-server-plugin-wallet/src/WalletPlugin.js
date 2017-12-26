/* @flow */
import {
  type CLIHookConfig,
  type InteractiveCommand,
  type ResourceType,
  Plugin,
} from '@neo-one/server-plugin';

import { constants as compilerConstants } from '@neo-one/server-plugin-compiler';
import { constants as networkConstants } from '@neo-one/server-plugin-network';

import SmartContractResourceType from './SmartContractResourceType';
import WalletResourceType from './WalletResourceType';

import activateWallet from './activateWallet';
import constants from './constants';
import deactivateWallet from './deactivateWallet';

export default class WalletPlugin extends Plugin {
  walletResourceType: WalletResourceType = new WalletResourceType({
    plugin: this,
  });
  smartContractResourceType: SmartContractResourceType = new SmartContractResourceType(
    {
      plugin: this,
    },
  );

  get name(): string {
    return constants.PLUGIN;
  }

  get names(): {|
    capital: string,
    capitalPlural: string,
    lower: string,
    lowerPlural: string,
  |} {
    return {
      capital: 'Wallet',
      capitalPlural: 'Wallets',
      lower: 'wallet',
      lowerPlural: 'wallets',
    };
  }

  get dependencies(): Array<string> {
    return [networkConstants.PLUGIN, compilerConstants.PLUGIN];
  }

  // flowlint-next-line unclear-type:off
  get resourceTypes(): Array<ResourceType<any, any>> {
    return [this.walletResourceType, this.smartContractResourceType];
  }

  get interactive(): Array<InteractiveCommand> {
    return [activateWallet(this), deactivateWallet(this)];
  }

  get cliPostHooks(): Array<CLIHookConfig> {
    return [
      {
        name: 'create network',
        hook: async ({ cli, args }) => {
          const { name: networkName } = args;
          if (
            !(
              networkName === networkConstants.NETWORK_NAME.MAIN ||
              networkName === networkConstants.NETWORK_NAME.TEST
            )
          ) {
            await cli.exec(
              `create wallet master --network ${networkName} --private-key ` +
                `${networkConstants.PRIVATE_NET_PRIVATE_KEY}`,
            );
          }
        },
      },
      {
        name: 'deactivate network',
        hook: async ({ cli }) => {
          const { wallet } = await cli.getSession(constants.PLUGIN);
          if (wallet != null) {
            await cli.exec('deactivate wallet');
          }
        },
      },
    ];
  }
}
