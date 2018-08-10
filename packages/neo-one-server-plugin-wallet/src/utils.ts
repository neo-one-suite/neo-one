import { PluginManager } from '@neo-one/server-plugin';
import { take } from 'rxjs/operators';
import { constants } from './constants';
import { WalletRequiredError } from './errors';
import { MasterWalletResourceAdapter } from './MasterWalletResourceAdapter';
import { WalletClient } from './types';
import { Wallet } from './WalletResourceType';

// tslint:disable-next-line export-name
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
