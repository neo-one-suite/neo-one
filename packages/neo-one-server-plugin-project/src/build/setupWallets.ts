import { NEOONEDataProvider } from '@neo-one/client-core';
import { setupWallets as setupWalletsBase, WALLETS as WALLETS_BASE } from '@neo-one/local';
import { Network } from '@neo-one/server-plugin-network';

export const WALLETS = WALLETS_BASE;

export const setupWallets = async (network: Network, masterPrivateKey: string) => {
  const provider = new NEOONEDataProvider({ network: 'local', rpcURL: network.nodes[0].rpcAddress });

  return setupWalletsBase(provider, masterPrivateKey);
};
