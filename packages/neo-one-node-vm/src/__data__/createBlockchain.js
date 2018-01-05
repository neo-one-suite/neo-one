/* @flow */
import { type Contract, common, crypto } from '@neo-one/client-core';

export default ({
  contracts = [],
}: {|
  contracts?: Array<Contract>,
|}): $FlowFixMe => {
  const blockchain = ({
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
  }: $FlowFixMe);
  if (contracts.length > 0) {
    const scriptHashToContract = contracts.reduce((acc, contract) => {
      acc[
        common.uInt160ToString(crypto.toScriptHash(contract.script))
      ] = contract;
      return acc;
    }, {});
    blockchain.contract.get = jest.fn(async ({ hash }) => {
      const contract = scriptHashToContract[common.uInt160ToString(hash)];
      if (contract == null) {
        throw new Error(`Unknown contract: ${common.uInt160ToString(hash)}`);
      }

      return contract;
    });
  }

  const storage = {};
  blockchain.storageItem.add = jest.fn(async (item) => {
    const hash = common.uInt160ToString(item.hash);
    if (storage[hash] == null) {
      storage[hash] = {};
    }

    storage[hash][item.key.toString('hex')] = item;
  });
  blockchain.storageItem.update = jest.fn(async (item, { value }) => {
    storage[common.uInt160ToString(item.hash)][
      item.key.toString('hex')
    ] = item.update({ value });
  });
  blockchain.storageItem.get = jest.fn(async ({ hash, key }) => {
    const hashStorage = storage[common.uInt160ToString(hash)];
    if (hashStorage == null) {
      throw new Error('Item not found');
    }

    const item = hashStorage[key.toString('hex')];
    if (item == null) {
      throw new Error('Item not found');
    }
    return item;
  });
  blockchain.storageItem.tryGet = jest.fn(
    async ({ hash, key }) =>
      (storage[common.uInt160ToString(hash)] || {})[key.toString('hex')],
  );
  blockchain.storageItem.delete = jest.fn(async ({ hash, key }) => {
    if (storage[common.uInt160ToString(hash)] != null) {
      delete storage[common.uInt160ToString(hash)][key.toString('hex')];
    }
  });

  blockchain.action.add = jest.fn(() => Promise.resolve());

  return blockchain;
};
