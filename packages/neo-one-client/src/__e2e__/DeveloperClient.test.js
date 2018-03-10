/* @flow */
import BigNumber from 'bignumber.js';

import { common } from '@neo-one/client-core';
import { utils } from '@neo-one/utils';
import _ from 'lodash';

import DeveloperClient from '../DeveloperClient';
import Client from '../Client';
import NEOONEProvider from '../provider/neoone/NEOONEProvider';
import LocalKeyStore from '../user/keystore/LocalKeyStore';
import LocalMemoryStore from '../user/keystore/LocalMemoryStore';
import LocalUserAccountProvider from '../user/LocalUserAccountProvider';
import type {
  TransactionResult,
  TransactionReceipt,
  UserAccountID,
} from '../types';

import { wifToPrivateKey } from '../helpers';

type WalletInfo = {|
  privateKey: string,
  accountID: UserAccountID,
|};

type SetupClientsReturn = {|
  developerClient: DeveloperClient,
  client: Client<*>,
  keystore: LocalKeyStore,
  master: WalletInfo,
|};

async function getWalletInfo({
  walletName,
  networkName,
}: {|
  walletName: string,
  networkName: string,
|}): Promise<WalletInfo> {
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
  await new Promise(resolve => setTimeout(() => resolve(), 10000));
  const output = await one.execute(`describe network ${networkName} --json`);

  const description = one.parseJSON(output);
  return description[3][1].table[1][3];
}

async function addWallet({
  walletName,
  keystore,
  networkName,
}: {|
  walletName: string,
  keystore: LocalKeyStore,
  networkName: string,
|}): Promise<WalletInfo> {
  if (walletName !== 'master') {
    await one.execute(`create wallet ${walletName} --network ${networkName}`);
  }
  const wallet = await getWalletInfo({ walletName, networkName });
  await keystore.addAccount({
    network: networkName,
    name: walletName,
    privateKey: wifToPrivateKey(wallet.privateKey),
  });
  return wallet;
}

async function setupClients(networkName: string): Promise<SetupClientsReturn> {
  const masterWallet = 'master';
  const keystore = new LocalKeyStore({
    store: new LocalMemoryStore(),
  });

  const rpcURL = await setupNetwork(networkName);
  const master = await addWallet({
    walletName: masterWallet,
    keystore,
    networkName,
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

  return {
    developerClient,
    client,
    keystore,
    master,
  };
}

async function setupTransaction({
  client,
  master,
  wallet,
}: {|
  client: Client<*>,
  master: WalletInfo,
  wallet: WalletInfo,
|}): Promise<TransactionResult<TransactionReceipt>> {
  const transaction = await client.transfer(
    new BigNumber(1000),
    common.NEO_ASSET_HASH,
    wallet.accountID.address,
    { from: master.accountID },
  );

  return transaction;
}

async function checkWalletBalance({
  walletName,
  networkName,
}: {|
  walletName: string,
  networkName: string,
|}): Promise<void> {
  const walletOutput = await one.execute(
    `describe wallet ${walletName} --network ${networkName} --json`,
  );
  const walletDescribe = one.parseJSON(walletOutput);
  expect(walletDescribe[7][1].table[1][1]).toEqual('1000');
}

async function confirmTransaction(
  transaction: TransactionResult<TransactionReceipt>,
): Promise<void> {
  let done = false;
  await Promise.all([
    transaction.confirmed().then(() => {
      done = true;
    }),
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

async function getBlockTimes({
  client,
  networkName,
}: {|
  client: Client<*>,
  networkName: string,
|}): Promise<Array<number>> {
  const blockCount = await client.read(networkName).getBlockCount();
  const indices = _.range(1, blockCount);
  const blocks = await Promise.all(
    indices.map(i => client.read(networkName).getBlock(i)),
  );

  return blocks.map(block => block.time);
}

describe('DeverloperClient', () => {
  test('runConsensusNow', async () => {
    const networkName = 'e2e-1';
    const walletName = 'wallet-1';

    const { developerClient, client, keystore, master } = await setupClients(
      networkName,
    );
    const wallet = await addWallet({ walletName, keystore, networkName });

    const transaction = await setupTransaction({ client, master, wallet });

    await Promise.all([
      confirmTransaction(transaction),
      developerClient.runConsensusNow(),
    ]);

    await checkWalletBalance({ walletName, networkName });
  });

  test('updateSettings', async () => {
    const networkName = 'e2e-2';
    const walletName = 'wallet-2';

    const { developerClient, client, keystore, master } = await setupClients(
      networkName,
    );
    const wallet = await addWallet({ walletName, keystore, networkName });

    await developerClient.updateSettings({ secondsPerBlock: 1 });
    await new Promise(resolve => setTimeout(() => resolve(), 15000));
    const transaction = await setupTransaction({ client, master, wallet });

    await confirmTransaction(transaction);

    await checkWalletBalance({ walletName, networkName });
  });

  test('fastForwardOffset', async () => {
    const networkName = 'e2e-3';
    const secondsPerBlock = 1;
    const offsetSeconds = 1000000000;

    const { developerClient, client } = await setupClients(networkName);

    await developerClient.updateSettings({ secondsPerBlock });
    await new Promise(resolve => setTimeout(() => resolve(), 15000));

    await developerClient.fastForwardOffset(offsetSeconds);
    await new Promise(resolve => setTimeout(() => resolve(), 2000));

    const times = await getBlockTimes({ client, networkName });

    let offsetFound = false;
    for (let i = 0; i < times.length - 1; i += 1) {
      const offset = times[i + 1] - times[i];
      if (offset >= offsetSeconds) {
        offsetFound = true;
        break;
      }
    }
    expect(offsetFound).toEqual(true);
  });

  test('fastForwardToTime', async () => {
    const networkName = 'e2e-4';
    const secondsPerBlock = 1;
    const offset = 1000000000;

    const { developerClient, client } = await setupClients(networkName);

    await developerClient.updateSettings({ secondsPerBlock });
    await new Promise(resolve => setTimeout(() => resolve(), 15000));

    const time = utils.nowSeconds() + offset;
    await developerClient.fastForwardToTime(time);
    await new Promise(resolve => setTimeout(() => resolve(), 2000));

    const times = await getBlockTimes({ client, networkName });

    const timeFound = times.find(blockTime => blockTime >= time);

    expect(timeFound).toBeDefined();
  });
});
