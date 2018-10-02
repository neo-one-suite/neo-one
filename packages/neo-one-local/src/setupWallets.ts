import { common, crypto } from '@neo-one/client-common';
import { Hash256, NEOONEDataProvider, privateKeyToAddress, Transfer, wifToPrivateKey } from '@neo-one/client-full';
import BigNumber from 'bignumber.js';
import { constants } from './constants';
import { getClients } from './getClients';

interface BootstrapWallet {
  readonly name: string;
  readonly privateKey: string;
  readonly publicKey: string;
  readonly amount: BigNumber;
}

export const WALLETS: ReadonlyArray<BootstrapWallet> = [
  {
    name: 'alfa',
    privateKey: 'KyX5sPKRpAMb3XAFLUrHv7u1LxKkKFrpyJDgE4kceRX9FRJ4WRCQ',
    publicKey: '0396b1b894ff7c6a7ee9f2a57d78e431d4b6e72d27d9c636b3a80eeee49eeee308',
    amount: new BigNumber('0'),
  },
  {
    name: 'bravo',
    privateKey: 'L5LfJc2Ngsxu8ZFMvnJbYJ1QdQCstzRXmKLybsFS1aQFURkJ5CHS',
    publicKey: '022df3bc467853e7ff40f7eeef81d04031dedfbb7095ab67014df477f4b7043df2',
    amount: new BigNumber('1'),
  },
  {
    name: 'charlie',
    privateKey: 'KxCH2Ei4TLqp2Qa7swz9bstQc5uREiCpvzvL9R6xLX8X5U8ZqeBj',
    publicKey: '03efd5b3b7109bf28336a38a322098e684c490e625d114ee3b20013ebc1f8e66c2',
    amount: new BigNumber('10'),
  },
  {
    name: 'delta',
    privateKey: 'KyVvngWhhfHiociMuwyLmGw8xTu9myKXRnvv5Fes9jDMa2Zyc6P9',
    publicKey: '03af86b9d85d562ea00f95141fb1136f36c4a50b7799fbe54cf65d5d722d376f8d',
    amount: new BigNumber('100'),
  },
  {
    name: 'echo',
    privateKey: 'L37qr7PWqWmgjUPfRC9mS78GjRxgGi4azySCsLUBMAa5hMka2JEm',
    publicKey: '02b29ac91eb8b50aec2195c125bddf6706e2813f9d586ec4209fcf7888cd7bd2bc',
    amount: new BigNumber('1000'),
  },
  {
    name: 'foxtrot',
    privateKey: 'KwFf8gdSWxvC5Pp8AidNdF6mHqjH3CukyF3RnfwS5vzMQKLGTP13',
    publicKey: '02be1976e139e834de23012e3b9e209b72986341c644a5e05665238bdc8cd8e918',
    amount: new BigNumber('10000'),
  },
  {
    name: 'golf',
    privateKey: 'Kyn2BN3QuHGYgkt9qJgvwzY8yH4xgTUAKwnGhvU1w8Nh3JnivrAr',
    publicKey: '03936152835e99aae441047688518a241187da4f752db4538970bcc32cde799bf9',
    amount: new BigNumber('100000'),
  },
  {
    name: 'hotel',
    privateKey: 'L5UXfz1xyzDkghGwistNMCV8pbpU4fg14Ez9rfo1y4KgwiadnWX3',
    publicKey: '03d126072e62368c3933c073c147c45968ea7db1a3c9fee90ae1926dea1eab6bbe',
    amount: new BigNumber('1000000'),
  },
  {
    name: 'india',
    privateKey: 'L5Yoq3X4ojx2FvZZxHbMcvT6var4LaXKHEpMYyyxw4jjhSUNJTRa',
    publicKey: '02afeb5b68738f2271a77ae47c9f7539559c0485bad1a14f8ae5910ec69744e5f7',
    amount: new BigNumber('5'),
  },
  {
    name: 'juliett',
    privateKey: 'L1DWex8PtmQJH4GYK9YAuyzmotyL6anY937LxJF54iaALrTtxsD6',
    publicKey: '029c67f85d0ac0539e47ff92224be449332cab2cc38514b8e9cce7f9682ee270e2',
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

export const setupWallets = async (
  provider: NEOONEDataProvider,
  masterPrivateKey: string = constants.PRIVATE_NET_PRIVATE_KEY,
) => {
  crypto.addPublicKey(
    common.stringToPrivateKey(wifToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY)),
    common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY),
  );
  WALLETS.forEach(({ privateKey, publicKey }) => {
    crypto.addPublicKey(common.stringToPrivateKey(wifToPrivateKey(privateKey)), common.stringToECPoint(publicKey));
  });
  const { client, developerClient } = await getClients(provider, masterPrivateKey);

  const account = await client.getAccount({
    network: provider.network,
    address: privateKeyToAddress(wifToPrivateKey(WALLETS[1].privateKey)),
  });
  if (
    (account.balances[Hash256.NEO] as BigNumber | undefined) === undefined ||
    account.balances[Hash256.NEO].isEqualTo(0)
  ) {
    const result = await client.transfer(
      WALLETS.reduce<ReadonlyArray<Transfer>>((acc, wallet) => acc.concat(createWalletTransfers(wallet)), []),
    );
    await Promise.all([result.confirmed(), developerClient.runConsensusNow()]);
  }

  return WALLETS;
};
