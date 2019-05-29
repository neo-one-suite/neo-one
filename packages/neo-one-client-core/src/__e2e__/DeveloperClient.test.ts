/// <reference types="@neo-one/types/e2e"/>

import { UserAccountID, wifToPrivateKey } from '@neo-one/client-common';
import {
  Client,
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  // tslint:disable-next-line no-implicit-dependencies
} from '@neo-one/client-core';
import { utils } from '@neo-one/utils';
import _ from 'lodash';

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
  await keystore.addUserAccount({
    network: networkName,
    name: walletName,
    privateKey: wifToPrivateKey(wallet.privateKey),
  });

  return wallet;
}

async function setupClients(networkName: string): Promise<SetupClientsReturn> {
  const masterWallet = 'master';
  const keystore = new LocalKeyStore(new LocalMemoryStore());
  const rpcURL = await setupNetwork(networkName);
  const master = await addWallet({
    walletName: masterWallet,
    keystore,
    networkName,
  });

  const provider = new NEOONEProvider([{ network: networkName, rpcURL }]);
  const localUserAccountProvider = new LocalUserAccountProvider({
    keystore,
    provider,
  });
  const providers = {
    memory: localUserAccountProvider,
  };
  const client = new Client(providers);
  const developerClient = new DeveloperClient(provider.read(networkName));

  return {
    developerClient,
    client,
    keystore,
    master,
  };
}

async function getBlockTimes({
  client,
  networkName,
}: {
  readonly client: Client;
  readonly networkName: string;
}): Promise<ReadonlyArray<number>> {
  const readProvider = client.providers.memory.provider.read(networkName);
  const blockCount = await readProvider.getBlockCount();
  const indices = _.range(1, blockCount);
  const blocks = await Promise.all(indices.map(async (i) => readProvider.getBlock(i)));

  return blocks.map((block) => block.time);
}

describe('DeveloperClient', () => {
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
