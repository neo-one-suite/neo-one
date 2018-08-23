import {
  Client,
  DeveloperClient,
  Hash256,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEDataProvider,
  NEOONEProvider,
  privateKeyToAddress,
  Transfer,
  wifToPrivateKey,
} from '@neo-one/client';
import { Network } from '@neo-one/server-plugin-network';
import BigNumber from 'bignumber.js';

interface BootstrapWallet {
  readonly name: string;
  readonly privateKey: string;
  readonly amount: BigNumber;
}

export const WALLETS: ReadonlyArray<BootstrapWallet> = [
  {
    name: 'alfa',
    privateKey: 'KyX5sPKRpAMb3XAFLUrHv7u1LxKkKFrpyJDgE4kceRX9FRJ4WRCQ',
    amount: new BigNumber('0'),
  },
  {
    name: 'bravo',
    privateKey: 'L5LfJc2Ngsxu8ZFMvnJbYJ1QdQCstzRXmKLybsFS1aQFURkJ5CHS',
    amount: new BigNumber('1'),
  },
  {
    name: 'charlie',
    privateKey: 'KxCH2Ei4TLqp2Qa7swz9bstQc5uREiCpvzvL9R6xLX8X5U8ZqeBj',
    amount: new BigNumber('10'),
  },
  {
    name: 'delta',
    privateKey: 'KyVvngWhhfHiociMuwyLmGw8xTu9myKXRnvv5Fes9jDMa2Zyc6P9',
    amount: new BigNumber('100'),
  },
  {
    name: 'echo',
    privateKey: 'L37qr7PWqWmgjUPfRC9mS78GjRxgGi4azySCsLUBMAa5hMka2JEm',
    amount: new BigNumber('1000'),
  },
  {
    name: 'foxtrot',
    privateKey: 'KwFf8gdSWxvC5Pp8AidNdF6mHqjH3CukyF3RnfwS5vzMQKLGTP13',
    amount: new BigNumber('10000'),
  },
  {
    name: 'golf',
    privateKey: 'Kyn2BN3QuHGYgkt9qJgvwzY8yH4xgTUAKwnGhvU1w8Nh3JnivrAr',
    amount: new BigNumber('100000'),
  },
  {
    name: 'hotel',
    privateKey: 'L5UXfz1xyzDkghGwistNMCV8pbpU4fg14Ez9rfo1y4KgwiadnWX3',
    amount: new BigNumber('1000000'),
  },
  {
    name: 'india',
    privateKey: 'L5Yoq3X4ojx2FvZZxHbMcvT6var4LaXKHEpMYyyxw4jjhSUNJTRa',
    amount: new BigNumber('5'),
  },
  {
    name: 'juliett',
    privateKey: 'L1DWex8PtmQJH4GYK9YAuyzmotyL6anY937LxJF54iaALrTtxsD6',
    amount: new BigNumber('20'),
  },
];

const createWalletTransfers = (to: BootstrapWallet) => [
  {
    to: privateKeyToAddress(wifToPrivateKey(to.privateKey)),
    asset: Hash256.NEO,
    amount: to.amount,
  },
  {
    to: privateKeyToAddress(wifToPrivateKey(to.privateKey)),
    asset: Hash256.GAS,
    amount: to.amount,
  },
];

export const setupWallets = async (network: Network, masterPrivateKey: string) => {
  const provider = new NEOONEDataProvider({ network: 'local', rpcURL: network.nodes[0].rpcAddress });
  const client = new Client({
    memory: new LocalUserAccountProvider({
      keystore: new LocalKeyStore({ store: new LocalMemoryStore() }),
      provider: new NEOONEProvider([provider]),
    }),
  });
  const developerClient = new DeveloperClient(provider);

  await client.providers.memory.keystore.addAccount({
    network: 'local',
    privateKey: masterPrivateKey,
  });
  const result = await client.transfer(
    WALLETS.reduce<ReadonlyArray<Transfer>>((acc, wallet) => acc.concat(createWalletTransfers(wallet)), []),
  );
  await Promise.all([result.confirmed(), developerClient.runConsensusNow()]);
};
