import { common } from '@neo-one/client-core';
import { TaskList } from '@neo-one/server-plugin';
import { constants as walletConstants, Wallet as WalletResource } from '@neo-one/server-plugin-wallet';
import { filter, take } from 'rxjs/operators';
import { CreateContext } from './types';

export const setupWalletsEnabled = (ctx: CreateContext) => ctx.options.wallets !== undefined;
export const setupWallets = {
  title: 'Setup wallets',
  enabled: setupWalletsEnabled,
  task: (ctx: CreateContext) => {
    const { wallets } = ctx.options;
    if (wallets === undefined) {
      throw new Error('For Flow');
    }

    return new TaskList({
      tasks: wallets.map((wallet) => ({
        title: `Setup wallet ${wallet.baseName}`,
        task: () =>
          new TaskList({
            tasks: [
              {
                title: 'Create wallet',
                task: () => {
                  ctx.mutableDependencies.push({
                    plugin: walletConstants.PLUGIN,
                    resourceType: walletConstants.WALLET_RESOURCE_TYPE,
                    name: wallet.name,
                  });

                  return ctx.pluginManager
                    .getResourcesManager({
                      plugin: walletConstants.PLUGIN,
                      resourceType: walletConstants.WALLET_RESOURCE_TYPE,
                    })
                    .create(wallet.name, { privateKey: wallet.privateKey });
                },
              },

              {
                title: 'Transfer funds to wallet',
                task: async () => {
                  const manager = ctx.pluginManager.getResourcesManager({
                    plugin: walletConstants.PLUGIN,
                    resourceType: walletConstants.WALLET_RESOURCE_TYPE,
                  });

                  const [walletResource, masterResource] = await Promise.all([
                    manager
                      .getResource$({
                        name: wallet.name,
                        options: {},
                      })
                      .pipe(
                        filter((value) => value !== undefined),
                        take(1),
                      )
                      .toPromise() as Promise<WalletResource>,
                    manager
                      .getResource$({
                        name: walletConstants.makeMasterWallet(wallet.network),
                        options: {},
                      })
                      .pipe(
                        filter((value) => value !== undefined),
                        take(1),
                      )
                      .toPromise() as Promise<WalletResource>,
                  ]);

                  const masterWallet = {
                    network: wallet.network,
                    address: masterResource.address,
                  };

                  // tslint:disable-next-line no-any
                  let transferNEO: Promise<any> = Promise.resolve();
                  if (wallet.neo !== undefined) {
                    transferNEO = ctx.client.transfer(wallet.neo, common.NEO_ASSET_HASH, walletResource.address, {
                      from: masterWallet,
                    });
                  }
                  // tslint:disable-next-line no-any
                  let transferGAS: Promise<any> = Promise.resolve();
                  if (wallet.gas !== undefined) {
                    transferGAS = ctx.client.transfer(wallet.gas, common.GAS_ASSET_HASH, walletResource.address, {
                      from: masterWallet,
                    });
                  }
                  await Promise.all([transferNEO, transferGAS]);
                },
              },
            ],
          }),
      })),
      concurrent: true,
    });
  },
};
