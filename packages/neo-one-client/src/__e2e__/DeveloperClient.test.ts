import { common } from '@neo-one/client-core';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import {
  Client,
  DeveloperClient,
  wifToPrivateKey,
  NEOONEProvider,
  TransactionReceipt,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  TransactionResult,
  UserAccountID,
} from '@neo-one/client';

interface WalletInfo {
  readonly privateKey: string;
  readonly accountID: UserAccountID;
}

interface SetupClientsReturn {
  readonly developerClient: DeveloperClient;
  readonly client: Client;
  readonly keystore: LocalKeyStore;
  readonly master: WalletInfo;
}

async function getWalletInfo({
  walletName,
  networkName,
}: {
  readonly walletName: string;
  readonly networkName: string;
}): Promise<WalletInfo> {
  const output = await one.execute(`describe wallet ${walletName} --network ${networkName} --json`);

  const wallet = one.parseJSON(output);

  return {
    privateKey: wallet.wif,
    accountID: {
      network: networkName,
      address: wallet.address,
    },
  };
}

async function setupNetwork(networkName: string): Promise<string> {
  await one.execute(`create network ${networkName}`);
  const output = await one.execute(`describe network ${networkName} --json`);

  const network = one.parseJSON(output);

  return network.nodes[0].rpcAddress;
}

async function addWallet({
  walletName,
  keystore,
  networkName,
}: {
  readonly walletName: string;
  readonly keystore: LocalKeyStore;
  readonly networkName: string;
}): Promise<WalletInfo> {
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
  const localUserAccountProvider = new LocalUserAccountProvider({
    keystore,
    provider,
  });
  const providers = {
    memory: localUserAccountProvider,
  };
  const client = new Client(providers);

  const developerClient = new DeveloperClient(provider.read(networkName), providers);

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
}: {
  readonly client: Client;
  readonly master: WalletInfo;
  readonly wallet: WalletInfo;
}): Promise<TransactionResult<TransactionReceipt>> {
  return client.transfer(new BigNumber(1000), common.NEO_ASSET_HASH, wallet.accountID.address, {
    from: master.accountID,
  });
}

async function checkWalletBalance({
  walletName,
  networkName,
}: {
  readonly walletName: string;
  readonly networkName: string;
}): Promise<void> {
  const walletOutput = await one.execute(`describe wallet ${walletName} --network ${networkName} --json`);

  const wallet = one.parseJSON(walletOutput);
  expect(wallet.balance[0].amount).toEqual('1000');
}

async function confirmTransaction(transaction: TransactionResult<TransactionReceipt>): Promise<void> {
  await transaction.confirmed({ timeoutMS: 2000 });
}

async function getBlockTimes({
  client,
  networkName,
}: {
  readonly client: Client;
  readonly networkName: string;
}): Promise<ReadonlyArray<number>> {
  const blockCount = await client.read(networkName).getBlockCount();
  const indices = _.range(1, blockCount);
  const blocks = await Promise.all(indices.map(async (i) => client.read(networkName).getBlock(i)));

  return blocks.map((block) => block.time);
}

describe('DeveloperClient', () => {
  test('runConsensusNow', async () => {
    const networkName = 'e2e-1';
    const walletName = 'wallet-1';

    const { developerClient, client, keystore, master } = await setupClients(networkName);

    const wallet = await addWallet({ walletName, keystore, networkName });

    const transaction = await setupTransaction({ client, master, wallet });

    await Promise.all([confirmTransaction(transaction), developerClient.runConsensusNow()]);

    await checkWalletBalance({ walletName, networkName });
  });

  test('updateSettings', async () => {
    const networkName = 'e2e-2';
    const walletName = 'wallet-2';

    const { developerClient, client, keystore, master } = await setupClients(networkName);

    const wallet = await addWallet({ walletName, keystore, networkName });

    await developerClient.updateSettings({ secondsPerBlock: 1 });
    await developerClient.reset();

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
    await developerClient.reset();
    await new Promise<void>((resolve) => setTimeout(resolve, 2500));

    await developerClient.fastForwardOffset(offsetSeconds);
    await new Promise<void>((resolve) => setTimeout(resolve, 2500));

    const times = await getBlockTimes({ client, networkName });
    let offsetFound = false;
    // tslint:disable-next-line no-loop-statement
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
    await developerClient.reset();
    await new Promise<void>((resolve) => setTimeout(resolve, 2500));

    const time = utils.nowSeconds() + offset;
    await developerClient.fastForwardToTime(time);
    await new Promise<void>((resolve) => setTimeout(resolve, 2500));

    const times = await getBlockTimes({ client, networkName });
    const timeFound = times.find((blockTime) => blockTime >= time);
    expect(timeFound).toBeDefined();
  });
});
