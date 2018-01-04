/* @flow */
import { TaskList } from '@neo-one/server-plugin';

import { common } from '@neo-one/client-core';
import { constants as walletConstants } from '@neo-one/server-plugin-wallet';
import { filter, take } from 'rxjs/operators';

import type { CreateContext } from './types';

export const setupWalletsEnabled = (ctx: CreateContext) =>
  ctx.options.wallets != null;
export default {
  title: 'Setup wallets',
  enabled: setupWalletsEnabled,
  task: (ctx: CreateContext) => {
    const { wallets } = ctx.options;
    if (wallets == null) {
      throw new Error('For Flow');
    }

    return new TaskList({
      tasks: wallets.map(wallet => ({
        title: `Setup wallet ${wallet.baseName}`,
        task: () =>
          new TaskList({
            tasks: [
              {
                title: 'Create wallet',
                task: () => {
                  ctx.dependencies.push({
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
                      .pipe(filter(value => value != null), take(1))
                      .toPromise(),
                    manager
                      .getResource$({
                        name: walletConstants.makeMasterWallet(wallet.network),
                        options: {},
                      })
                      .pipe(take(1))
                      .toPromise(),
                  ]);
                  if (walletResource == null || masterResource == null) {
                    throw new Error('Something went wrong!');
                  }
                  let transferNEO = Promise.resolve();
                  if (wallet.neo != null) {
                    transferNEO = ctx.client.transfer(
                      wallet.neo,
                      common.NEO_ASSET_HASH,
                      walletResource.address,
                      { from: masterResource.address },
                    );
                  }
                  let transferGAS = Promise.resolve();
                  if (wallet.gas != null) {
                    transferGAS = ctx.client.transfer(
                      wallet.gas,
                      common.GAS_ASSET_HASH,
                      walletResource.address,
                      { from: masterResource.address },
                    );
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
