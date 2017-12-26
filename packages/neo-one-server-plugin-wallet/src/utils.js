/* @flow */
import type { PluginManager } from '@neo-one/server-plugin';

import { constants as networkConstants } from '@neo-one/server-plugin-network';
import {
  type NetworkType as ClientNetworkType,
  networks,
} from '@neo-one/client';

import { take } from 'rxjs/operators';

import type MasterWalletResourceAdapter from './MasterWalletResourceAdapter';
import type { Wallet } from './WalletResourceType';
import type { WalletClient } from './types';
import { WalletRequiredError } from './errors';

import constants from './constants';

export const getClientNetworkType = (
  networkName: string,
): ClientNetworkType => {
  if (networkName === networkConstants.NETWORK_NAME.MAIN) {
    return networks.MAIN;
  } else if (networkName === networkConstants.NETWORK_NAME.TEST) {
    return networks.TEST;
  }

  return networkName;
};

export const getWallet = async ({
  pluginManager,
  walletName,
}: {|
  pluginManager: PluginManager,
  walletName: string,
|}): Promise<{| client: WalletClient, wallet: Wallet |}> => {
  const manager = pluginManager.getResourcesManager({
    plugin: constants.PLUGIN,
    resourceType: constants.WALLET_RESOURCE_TYPE,
  });
  const wallet = await manager
    .getResource$({
      name: walletName,
      options: {},
    })
    .pipe(take(1))
    .toPromise();
  if (wallet == null) {
    throw new WalletRequiredError();
  }
  const walletMasterResourceAdapter = (manager.masterResourceAdapter: MasterWalletResourceAdapter);
  return {
    client: walletMasterResourceAdapter.client,
    wallet,
  };
};
