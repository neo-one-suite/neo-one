/* @flow */
import {
  type CLIHookConfig,
  type CreateHookConfig,
  type InteractiveCommand,
  type ResourceType,
  Plugin,
  compoundName,
} from '@neo-one/server-plugin';

import { constants as compilerConstants } from '@neo-one/server-plugin-compiler';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { wifToPrivateKey } from '@neo-one/client';

import SmartContractResourceType from './SmartContractResourceType';
import WalletResourceType from './WalletResourceType';

import activateWallet from './activateWallet';
import constants from './constants';
import deactivateWallet from './deactivateWallet';
import bootstrap from './bootstrap';

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

  get resourceTypes(): Array<ResourceType<any, any>> {
    return [this.walletResourceType, this.smartContractResourceType];
  }

  get interactive(): Array<InteractiveCommand> {
    return [activateWallet(this), deactivateWallet(this), bootstrap(this)];
  }

  get createHooks(): Array<CreateHookConfig> {
    return [
      {
        plugin: networkConstants.PLUGIN,
        resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
        hook: ({ name, pluginManager }) => ({
          title: 'Create master wallet',
          skip: () => {
            if (
              name === networkConstants.NETWORK_NAME.MAIN ||
              name === networkConstants.NETWORK_NAME.TEST
            ) {
              return 'Master wallets are only created for private networks';
            }

            return false;
          },
          task: () =>
            pluginManager
              .getResourcesManager({
                plugin: constants.PLUGIN,
                resourceType: constants.WALLET_RESOURCE_TYPE,
              })
              .create(compoundName.make({ names: [name], name: 'master' }), {
                network: name,
                privateKey: wifToPrivateKey(
                  networkConstants.PRIVATE_NET_PRIVATE_KEY,
                ),
              }),
        }),
      },
    ];
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
            await cli.exec(`activate wallet master`);
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
