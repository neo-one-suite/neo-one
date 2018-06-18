// tslint:disable no-any no-object-mutation readonly-keyword
import { common, Contract, crypto, StorageItem } from '@neo-one/client-core';

type Storages = { [key: string]: StorageItem };

export const createBlockchain = ({ contracts = [] }: { readonly contracts?: ReadonlyArray<Contract> }): any => {
  const blockchain = {
    contract: {},
    storageItem: {},
    settings: {
      vm: {},
    },

    action: {},
    output: {},
    asset: {},
    currentBlock: {
      timestamp: 1518512400,
    },
  } as any;

  if (contracts.length > 0) {
    const scriptHashToContract = contracts.reduce<{ [key: string]: Contract }>((acc, contract) => {
      acc[common.uInt160ToString(crypto.toScriptHash(contract.script))] = contract;
      return acc;
    }, {});
    blockchain.contract.get = jest.fn(async ({ hash }) => {
      const contract = scriptHashToContract[common.uInt160ToString(hash)];
      if (contract === undefined) {
        throw new Error(`Unknown contract: ${common.uInt160ToString(hash)}`);
      }

      return contract;
    });
  }

  const storage: { [key: string]: Storages } = {};
  blockchain.storageItem.add = jest.fn(async (item) => {
    const hash = common.uInt160ToString(item.hash);
    if ((storage[hash] as Storages | undefined) === undefined) {
      storage[hash] = {};
    }

    storage[hash][item.key.toString('hex')] = item;
  });
  blockchain.storageItem.update = jest.fn(async (item, { value }) => {
    storage[common.uInt160ToString(item.hash)][item.key.toString('hex')] = item.update({ value });
  });
  blockchain.storageItem.get = jest.fn(async ({ hash, key }) => {
    const hashStorage = storage[common.uInt160ToString(hash)];
    if ((hashStorage as Storages | undefined) === undefined) {
      throw new Error('Item not found');
    }

    const item = hashStorage[key.toString('hex')] as StorageItem | undefined;
    if (item === undefined) {
      throw new Error('Item not found');
    }

    return item;
  });
  blockchain.storageItem.tryGet = jest.fn(
    async ({ hash, key }) => (storage[common.uInt160ToString(hash)] || {})[key.toString('hex')],
  );

  blockchain.storageItem.delete = jest.fn(async ({ hash, key }) => {
    if (storage[common.uInt160ToString(hash)] !== undefined) {
      delete storage[common.uInt160ToString(hash)][key.toString('hex')];
    }
  });

  blockchain.action.add = jest.fn(async () => Promise.resolve());

  return blockchain;
};
