import {
  BootstrapWallet,
  Configuration,
  setupWallets as setupWalletsBase,
  WALLETS as WALLETS_BASE,
} from '@neo-one/cli-common';
import { common, crypto, privateKeyToAddress, wifToPrivateKey } from '@neo-one/client-common';
import { Hash160, NEOONEDataProvider } from '@neo-one/client-core';
import { constants } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { getPrimaryKeys } from '../common';

export const WALLETS = WALLETS_BASE;

const hasBalance = async (provider: NEOONEDataProvider, wallet: BootstrapWallet) => {
  const privateKey = wifToPrivateKey(wallet.wif);
  crypto.addPublicKey(common.stringToPrivateKey(privateKey), common.stringToECPoint(wallet.publicKey));
  const account = await provider.getAccount(privateKeyToAddress(privateKey));

  return (
    (account.balances[Hash160.NEO] as BigNumber | undefined) !== undefined ||
    (account.balances[Hash160.GAS] as BigNumber | undefined)
  );
};

export const setupWallets = async (config: Configuration) => {
  const rpcURL = `http://localhost:${config.network.port}/rpc`;
  const provider = new NEOONEDataProvider({ network: constants.LOCAL_NETWORK_NAME, rpcURL });
  const hasBalances = await Promise.all(WALLETS.map((wallet) => hasBalance(provider, wallet)));
  if (!hasBalances.some((value) => value)) {
    const { privateKey } = getPrimaryKeys();
    await setupWalletsBase(provider, common.privateKeyToString(privateKey));
  }
};
