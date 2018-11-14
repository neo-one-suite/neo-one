import { wifToPrivateKey } from '@neo-one/client-common';
import {
  CLIHookConfig,
  compoundName,
  CreateHookConfig,
  InteractiveCommand,
  Plugin,
  ResourceType,
} from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { activateWallet } from './activateWallet';
import { bootstrap } from './bootstrap';
import { constants } from './constants';
import { deactivateWallet } from './deactivateWallet';
import { WalletResourceType } from './WalletResourceType';

export class WalletPlugin extends Plugin {
  public readonly walletResourceType: WalletResourceType = new WalletResourceType({
    plugin: this,
  });

  public get name(): string {
    return constants.PLUGIN;
  }

  public get names(): {
    readonly capital: string;
    readonly capitalPlural: string;
    readonly lower: string;
    readonly lowerPlural: string;
  } {
    return {
      capital: 'Wallet',
      capitalPlural: 'Wallets',
      lower: 'wallet',
      lowerPlural: 'wallets',
    };
  }

  public get dependencies(): ReadonlyArray<string> {
    return [networkConstants.PLUGIN];
  }

  public get resourceTypes(): ReadonlyArray<ResourceType> {
    return [this.walletResourceType];
  }

  public get interactive(): ReadonlyArray<InteractiveCommand> {
    return [activateWallet(this), deactivateWallet(this), bootstrap(this)];
  }

  public get createHooks(): ReadonlyArray<CreateHookConfig> {
    return [
      {
        plugin: networkConstants.PLUGIN,
        resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
        hook: ({ name, pluginManager }) => ({
          title: 'Create master wallet',
          skip: () => {
            if (name === networkConstants.NETWORK_NAME.MAIN || name === networkConstants.NETWORK_NAME.TEST) {
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
                privateKey: wifToPrivateKey(networkConstants.PRIVATE_NET_PRIVATE_KEY),
              }),
        }),
      },
    ];
  }

  public get cliPostHooks(): ReadonlyArray<CLIHookConfig> {
    return [
      {
        name: 'create network',
        hook: async ({ cli, args }) => {
          const { name: networkName } = args;
          if (
            !(networkName === networkConstants.NETWORK_NAME.MAIN || networkName === networkConstants.NETWORK_NAME.TEST)
          ) {
            await cli.exec(`activate wallet master`);
          }
        },
      },
      {
        name: 'deactivate network',
        hook: async ({ cli }) => {
          const { wallet } = await cli.getSession(constants.PLUGIN);
          if (wallet != undefined) {
            await cli.exec('deactivate wallet');
          }
        },
      },
    ];
  }
}
