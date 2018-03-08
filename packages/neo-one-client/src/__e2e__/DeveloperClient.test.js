/* @flow */
import BigNumber from 'bignumber.js';

import { common } from '@neo-one/client-core';

import DeveloperClient from '../DeveloperClient';
import Client from '../Client';
import NEOONEProvider from '../provider/neoone/NEOONEProvider';
import LocalKeyStore from '../user/keystore/LocalKeyStore';
import LocalMemoryStore from '../user/keystore/LocalMemoryStore';
import LocalUserAccountProvider from '../user/LocalUserAccountProvider';
import { wifToPrivateKey } from '../helpers';

async function getWalletInfo(
  walletName: string,
  networkName: string,
): Promise<Object> {
  const output = await one.execute(
    `describe wallet ${walletName} --network ${networkName} --json`,
  );
  const description = one.parseJSON(output);

  return {
    privateKey: description[3][1],
    accountID: {
      network: networkName,
      address: description[5][1],
    },
  };
}

async function setupNetwork(networkName: string): Promise<string> {
  await one.execute(`create network ${networkName}`);
  const output = await one.execute(`describe network ${networkName} --json`);

  const description = one.parseJSON(output);
  return description[3][1].table[1][3];
}

async function setupTransaction(
  networkName: string,
  walletName: string,
): Promise<Object> {
  const masterWallet = 'master';

  const rpcURL = await setupNetwork(networkName);
  await one.execute(`create wallet ${walletName} --network ${networkName}`);

  const master = await getWalletInfo(masterWallet, networkName);
  const wallet = await getWalletInfo(walletName, networkName);

  const keystore = new LocalKeyStore({
    store: new LocalMemoryStore(),
  });

  await keystore.addAccount({
    network: networkName,
    name: masterWallet,
    privateKey: wifToPrivateKey(master.privateKey),
  });

  await keystore.addAccount({
    network: networkName,
    name: walletName,
    privateKey: wifToPrivateKey(wallet.privateKey),
  });

  const provider = new NEOONEProvider({
    options: [{ network: networkName, rpcURL }],
  });

  const client = new Client({
    memory: new LocalUserAccountProvider({
      keystore,
      provider,
    }),
  });

  const developerClient = new DeveloperClient(provider.read(networkName));

  const transaction = await client.transfer(
    new BigNumber(1000),
    common.NEO_ASSET_HASH,
    wallet.accountID.address,
    { from: master.accountID },
  );

  return {
    developerClient,
    transaction,
  };
}

describe('DeverloperClient', () => {
  test('runConsensusNow', async () => {
    const network = 'e2e';
    const walletName = 'wallet-1';

    const { developerClient, transaction } = await setupTransaction(
      network,
      walletName,
    );

    const done = Promise.all([
      transaction.confirmed(),
      developerClient.runConsensusNow(),
    ]).then(() => true);

    await new Promise((resolve, reject) =>
      setTimeout(() => {
        if (done) {
          resolve();
        } else {
          reject(new Error('Timed out'));
        }
      }, 2000),
    );

    const walletOutput = await one.execute(
      `get wallet --network ${network} --json`,
    );
    const wallets = one.parseJSON(walletOutput);

    expect(wallets[2][4]).toEqual('1000');
  });

  test('updateSettings', async () => {
    const network = 'e2e';
    const walletName = 'wallet-1';

    const { developerClient, transaction } = await setupTransaction(
      network,
      walletName,
    );

    await developerClient.updateSettings({ secondsPerBlock: 1 });

    const done = transaction.confirmed();

    await new Promise((resolve, reject) =>
      setTimeout(() => {
        if (done) {
          resolve();
        } else {
          reject(new Error('Timed out'));
        }
      }, 2000),
    );

    const walletOutput = await one.execute(
      `get wallet --network ${network} --json`,
    );
    const wallets = one.parseJSON(walletOutput);

    expect(wallets[2][4]).toEqual('1000');
  });
});
