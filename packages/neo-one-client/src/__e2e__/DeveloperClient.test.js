/* @flow */
import BigNumber from 'bignumber.js';

import { common } from '@neo-one/client-core';
import { utils } from '@neo-one/utils';

import DeveloperClient from '../DeveloperClient';
import Client from '../Client';
import NEOONEProvider from '../provider/neoone/NEOONEProvider';
import LocalKeyStore from '../user/keystore/LocalKeyStore';
import LocalMemoryStore from '../user/keystore/LocalMemoryStore';
import LocalUserAccountProvider from '../user/LocalUserAccountProvider';
import type { TransactionResult, TransactionReceipt } from '../types';

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

async function setupClients(
  networkName: string,
  walletName?: string,
): Promise<Object> {
  const masterWallet = 'master';
  const keystore = new LocalKeyStore({
    store: new LocalMemoryStore(),
  });

  const rpcURL = await setupNetwork(networkName);
  const master = await getWalletInfo(masterWallet, networkName);
  await keystore.addAccount({
    network: networkName,
    name: masterWallet,
    privateKey: wifToPrivateKey(master.privateKey),
  });

  let wallet;
  if (walletName != null) {
    await one.execute(`create wallet ${walletName} --network ${networkName}`);

    wallet = await getWalletInfo(walletName, networkName);
    await keystore.addAccount({
      network: networkName,
      name: walletName,
      privateKey: wifToPrivateKey(wallet.privateKey),
    });
  }

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

  return {
    developerClient,
    client,
    master: master || null,
    wallet: wallet || null,
  };
}

async function setupTransaction(
  client: Client<LocalUserAccountProvider<NEOONEProvider>>,
  master: Object,
  wallet: Object,
): Promise<TransactionResult<TransactionReceipt>> {
  const transaction = await client.transfer(
    new BigNumber(1000),
    common.NEO_ASSET_HASH,
    wallet.accountID.address,
    { from: master.accountID },
  );

  return transaction;
}

async function checkWalletBalance(
  walletName: string,
  networkName: string,
): Promise<void> {
  const walletOutput = await one.execute(
    `describe wallet ${walletName} --network ${networkName} --json`,
  );
  const walletDescribe = one.parseJSON(walletOutput);
  expect(walletDescribe[7][1].table[1][1]).toEqual('1000');
}

async function confirmTransaction(
  transaction: TransactionResult<TransactionReceipt>,
  developerClient?: DeveloperClient,
): Promise<void> {
  let consensus;
  if (developerClient) {
    consensus = developerClient.runConsensusNow();
  }

  let done = false;
  await Promise.all([
    transaction.confirmed().then(() => {
      done = true;
    }),
    consensus,
    new Promise((resolve, reject) =>
      setTimeout(() => {
        if (done) {
          resolve();
        } else {
          reject(new Error('Timed out'));
        }
      }, 2000),
    ),
  ]);
}

describe('DeverloperClient', () => {
  test('runConsensusNow', async () => {
    const network = 'e2e-1';
    const walletName = 'wallet-1';

    const { developerClient, client, master, wallet } = await setupClients(
      network,
      walletName,
    );
    const transaction = await setupTransaction(client, master, wallet);

    await confirmTransaction(transaction, developerClient);

    await checkWalletBalance(walletName, network);
  });

  test('updateSettings', async () => {
    const network = 'e2e-2';
    const walletName = 'wallet-2';

    const { developerClient, client, master, wallet } = await setupClients(
      network,
      walletName,
    );

    await developerClient.updateSettings({ secondsPerBlock: 1 });
    await new Promise(resolve => setTimeout(() => resolve(), 15000));
    const transaction = await setupTransaction(client, master, wallet);

    await confirmTransaction(transaction);

    await checkWalletBalance(walletName, network);
  });

  test('fastForwardOffset', async () => {
    const network = 'e2e-3';
    const offsetSeconds = 1000000000;

    const { developerClient, client } = await setupClients(network);
    await developerClient.fastForwardOffset(offsetSeconds);
    await new Promise(resolve => setTimeout(() => resolve(), 15000));

    const firstBlock = await client.read(network).getBlock(0);
    const secondBlock = await client.read(network).getBlock(1);

    expect(secondBlock.time - firstBlock.time).toBeGreaterThanOrEqual(
      offsetSeconds,
    );
  });

  test('fastForwardToTime', async () => {
    const network = 'e2e-4';
    const time = utils.nowSeconds() + 1000000000;

    const { developerClient, client } = await setupClients(network);

    await developerClient.fastForwardToTime(time);
    await new Promise(resolve => setTimeout(() => resolve(), 15000));

    const block = await client.read(network).getBlock(1);
    expect(block.time).toBeGreaterThanOrEqual(time);
    expect(block.time).toBeLessThanOrEqual(time + 15);
  });
});
