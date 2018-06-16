import { networks, NetworkType as ClientNetworkType } from '@neo-one/client';
import { PluginManager } from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { take } from 'rxjs/operators';
import { constants } from './constants';
import { WalletRequiredError } from './errors';
import { MasterWalletResourceAdapter } from './MasterWalletResourceAdapter';
import { WalletClient } from './types';
import { Wallet } from './WalletResourceType';

export const getClientNetworkType = (networkName: string): ClientNetworkType => {
  if (networkName === networkConstants.NETWORK_NAME.MAIN) {
    return networks.MAIN;
  }
  if (networkName === networkConstants.NETWORK_NAME.TEST) {
    return networks.TEST;
  }

  return networkName;
};

export const getWallet = async ({
  pluginManager,
  walletName,
}: {
  readonly pluginManager: PluginManager;
  readonly walletName: string;
}): Promise<{ readonly client: WalletClient; readonly wallet: Wallet }> => {
  const manager = pluginManager.getResourcesManager({
    plugin: constants.PLUGIN,
    resourceType: constants.WALLET_RESOURCE_TYPE,
  });

  const walletResource = await manager
    .getResource$({
      name: walletName,
      options: {},
    })
    .pipe(take(1))
    .toPromise();
  if (walletResource === undefined) {
    throw new WalletRequiredError();
  }
  const wallet = walletResource as Wallet;

  const walletMasterResourceAdapter = manager.masterResourceAdapter as MasterWalletResourceAdapter;

  return {
    client: walletMasterResourceAdapter.client,
    wallet,
  };
};
