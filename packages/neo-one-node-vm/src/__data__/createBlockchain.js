/* @flow */
export default ({ contract }: {| contract?: Buffer |}): $FlowFixMe => {
  const blockchain = ({
    contract: {},
    storageItem: {},
    settings: {
      vm: {},
    },
    action: {},
    output: {},
  }: $FlowFixMe);
  if (contract != null) {
    blockchain.contract.get = jest.fn(() => Promise.resolve(contract));
  }

  const storage = {};
  blockchain.storageItem.add = jest.fn(async item => {
    storage[item.key.toString('hex')] = item;
  });
  blockchain.storageItem.update = jest.fn(async (item, { value }) => {
    storage[item.key.toString('hex')] = {
      ...item,
      value,
    };
  });
  blockchain.storageItem.get = jest.fn(async ({ key }) => {
    const item = storage[key.toString('hex')];
    if (item == null) {
      throw new Error('Item not found');
    }
    return item;
  });
  blockchain.storageItem.tryGet = jest.fn(
    async ({ key }) => storage[key.toString('hex')],
  );

  blockchain.action.add = jest.fn(() => Promise.resolve());

  return blockchain;
};
