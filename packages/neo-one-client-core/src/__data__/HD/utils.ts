import { common, crypto } from '@neo-one/client-common';
import { HDAccount, LocalPath } from '../../user/keystore';
import { ledgerAccountsNoNetwork } from './ledgerData';
import { localAccounts } from './localAccounts';
import { seedOne } from './seedOne';
import { seedThree } from './seedThree';
import { seedTwo } from './seedTwo';

export const mockGetItem = (setKey: string, nodeKey: string) => async (key: string) =>
  new Promise<string>((resolve, reject) => {
    if (key === setKey) {
      resolve(nodeKey);
    }

    reject();
  });

export const addHDKeysToCrypto = () => {
  [seedOne, seedTwo, seedThree].forEach(({ info }) => {
    Object.values(info).forEach(({ privateKeyString, publicKeyString }) => {
      crypto.addPublicKey(common.stringToPrivateKey(privateKeyString), common.stringToECPoint(publicKeyString));
    });
  });
};

export const getLedgerAccounts = (network: string): readonly HDAccount<number>[] =>
  ledgerAccountsNoNetwork.map((account) => ({
    identifier: account.identifier,
    userAccount: {
      id: { network, address: account.userAccount.id.address },
      name: account.userAccount.name,
      publicKey: account.userAccount.publicKey,
    },
  }));

export const getLocalHDAccounts = (network: string): readonly HDAccount<LocalPath>[] =>
  localAccounts.map((account) => ({
    identifier: account.identifier,
    userAccount: {
      id: { network, address: account.userAccount.id.address },
      name: account.userAccount.name,
      publicKey: account.userAccount.publicKey,
    },
  }));
