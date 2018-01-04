/* @flow */
/* eslint-disable no-loop-func */
import { VM_STATE, utils } from '@neo-one/client-core';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import BigNumber from 'bignumber.js';

import _ from 'lodash';
import { toArray } from 'ix/asynciterable/toarray';

import Client from '../Client';
import { JSONRPCClientProvider } from '../json';

import { keys, transactions } from '../__data__';

const getClient = () => {
  const provider = ({}: $FlowFixMe);
  const client = new Client({ provider });
  return { provider, client };
};

describe('Client provider methods', () => {
  const testCases = [
    {
      method: 'getOutput',
      args: [
        {
          txid: transactions.register.hashHex,
          vout: 0,
        },
      ],
    },
    {
      method: 'getClaimAmount',
      args: [
        {
          txid: transactions.register.hashHex,
          vout: 0,
        },
      ],
    },
    {
      method: '_getAllStorage',
      providerMethod: 'getAllStorage',
      args: [keys[0].address],
    },
    {
      method: '_getActions',
      providerMethod: 'getActions',
      args: [{}],
    },
    {
      method: '_getActions',
      providerMethod: 'getActions',
      args: [{ scriptHash: keys[0].scriptHash }],
    },
    {
      method: '_testInvocation',
      providerMethod: 'testInvocation',
      args: [Buffer.alloc(1, 0)],
    },
  ];

  let { client, provider } = getClient();
  beforeEach(() => {
    const result = getClient();
    // eslint-disable-next-line
    client = result.client;
    // eslint-disable-next-line
    provider = result.provider;
  });

  for (const testCase of testCases) {
    const { method, args } = testCase;
    let providerMethod = method;
    if (testCase.providerMethod != null) {
      // eslint-disable-next-line
      providerMethod = testCase.providerMethod;
    }

    test(method, async () => {
      const expected = {};
      provider[providerMethod] = jest.fn(() => Promise.resolve(expected));

      // $FlowFixMe
      const result = await client[method](...args);

      expect(result).toBe(expected);
      expect(provider[providerMethod]).toHaveBeenCalledTimes(1);
      expect(provider[providerMethod].mock.calls[0]).toMatchSnapshot();
    });
  }
});

const assetHash =
  '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';
const gasAssetHash =
  '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7';
const txid =
  '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f79';

const unspent = [
  {
    txid: '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f70',
    vout: 0,
  },
  {
    txid: '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f71',
    vout: 1,
  },
  {
    txid: '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f71',
    vout: 2,
  },
  {
    txid: '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f71',
    vout: 3,
  },
  {
    txid: '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f75',
    vout: 4,
  },
  {
    txid: '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f75',
    vout: 5,
  },
];
const outputs = [
  {
    value: '1',
    asset: assetHash,
    n: 0,
  },
  {
    value: '21',
    asset: assetHash,
    n: 1,
  },
  {
    value: '0.1',
    asset: gasAssetHash,
    n: 2,
  },
  {
    value: '5',
    asset: gasAssetHash,
    n: 3,
  },
  {
    value: '15',
    asset: gasAssetHash,
    n: 4,
  },
  {
    value: '10',
    asset: assetHash,
    n: 5,
  },
];
const unclaimed = [
  {
    txid: '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f70',
    vout: 0,
  },
  {
    txid: '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f71',
    vout: 1,
  },
];
const claimAmounts = ['10', '0.1'];

const account = { unspent, unclaimed };

const contractLike = {
  script: '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f71',
  parameters: ['String', 'ByteArray'],
  returnType: 'Boolean',
  hasStorage: true,
  name: 'Test',
  codeVersion: '0.1',
  author: 'test',
  email: 'test@test.com',
  description: 'foobar',
};
const assetLike = {
  assetType: 'Token',
  name: 'Test',
  amount: '100000',
  precision: 4,
  owner: keys[0].publicKey,
  admin: keys[0].address,
  issuer: keys[0].address,
};

describe('Client', () => {
  let client = new Client({ issueGASFee: '5' });
  let mock;
  beforeEach(() => {
    client = new Client({
      utilityTokenHash:
        '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
      issueGASFee: '5',
    });
    // $FlowFixMe
    client.transferRaw = jest.fn(() => Promise.resolve(txid));
    // $FlowFixMe
    client.getOutput = jest.fn(({ vout }) => Promise.resolve(outputs[vout]));
    // $FlowFixMe
    client.getAccount = jest.fn(() => Promise.resolve(account));
    // $FlowFixMe
    client.getClaimAmount = jest.fn(({ vout }) =>
      Promise.resolve(claimAmounts[vout]),
    );
    // $FlowFixMe
    client.claimRaw = jest.fn(() => Promise.resolve(txid));
    // $FlowFixMe
    client.invokeRaw = jest.fn(() => Promise.resolve(txid));

    mock = jest.spyOn(utils, 'randomUInt').mockReturnValue(10);
  });

  afterEach(() => {
    if (mock != null) {
      mock.mockRestore();
    }
  });

  test('constructor', () => {
    expect(new Client()._provider).toBeInstanceOf(JSONRPCClientProvider);
  });

  test('contract', async () => {
    // $FlowFixMe
    client.testInvokeRaw = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.HALT,
        stack: [{ type: 'Integer', value: '10' }],
      }),
    );
    const abi = await client.abi.NEP5(keys[0].scriptHash);

    expect(client.contract(abi)).toBeTruthy();
  });

  test('iterStorage', async () => {
    const hash = keys[0].scriptHash;
    const storageItems = [
      {
        hash,
        key: 'foobar',
        value: 'baz',
      },
      {
        hash,
        key: 'foobaz',
        value: 'bar',
      },
      {
        hash,
        key: 'barbaz',
        value: 'foo',
      },
    ];
    // $FlowFixMe
    client._getAllStorage = jest.fn(() => Promise.resolve(storageItems));

    const result = await toArray(client.iterStorage(hash));

    expect(client._getAllStorage).toHaveBeenCalledTimes(1);
    expect(client._getAllStorage).toHaveBeenCalledWith(hash);
    expect(result).toEqual(storageItems);
  });

  test('iterActions', async () => {
    const blockIndexStart = 10;
    const blockIndexStop = 20;
    const transactionIndexStart = 5;
    const transactionIndexStop = 5;
    const indexStart = 2;
    const indexStop = 5;
    // $FlowFixMe
    client.iterBlocks = jest.fn(
      ({ indexStart: indexStartIn, indexStop: indexStopIn }) =>
        AsyncIterableX.from(
          _.range(indexStartIn, indexStopIn + 1).map(index => ({ index })),
        ),
    );
    const actions = _.range(0, blockIndexStop + 10).map(blockIndex =>
      _.flatten(
        _.range(0, transactionIndexStop + 10).map(transactionIndex =>
          _.range(0, indexStop + 10).map(index => ({
            blockIndex,
            transactionIndex,
            index,
            scriptHash: keys[_.random(2)].scriptHash,
          })),
        ),
      ),
    );
    // $FlowFixMe
    client._getActions = jest.fn(({ blockIndexStart: blockIndexStartIn }) =>
      Promise.resolve(actions[blockIndexStartIn]),
    );

    const result = await toArray(
      client.iterActions({
        blockIndexStart,
        blockIndexStop,
        transactionIndexStart,
        transactionIndexStop,
        indexStart,
        indexStop,
      }),
    );

    const expected = _.flatten(
      _.range(blockIndexStart, blockIndexStop + 1).map(index => actions[index]),
    );
    expect(result).toEqual(expected);
    expect(client._getActions).toHaveBeenCalledTimes(
      blockIndexStop - blockIndexStart + 1,
    );
  });

  test('iterActions null argument', async () => {
    // $FlowFixMe
    client.iterBlocks = jest.fn(() => AsyncIterableX.from([]));

    const result = await toArray(client.iterActions());

    expect(result).toEqual([]);
  });

  test('transfer', async () => {
    const result = await client.transfer({
      transfers: [
        {
          to: keys[1].address,
          asset: assetHash,
          amount: '22',
        },
        {
          to: keys[1].address,
          asset: assetHash,
          amount: '1',
        },
        {
          to: keys[2].address,
          asset: assetHash,
          amount: '1',
        },
        {
          to: keys[2].address,
          asset: gasAssetHash,
          amount: '0.2',
        },
      ],
      privateKey: keys[0].privateKey,
    });

    expect(result).toEqual(txid);
    expect(client.transferRaw).toHaveBeenCalledTimes(1);
    expect(client.transferRaw.mock.calls[0][0]).toMatchSnapshot();
  });

  test('transfer throws InsufficientFundsError', async () => {
    try {
      await client.transfer({
        transfers: [
          {
            to: keys[1].address,
            asset: assetHash,
            amount: '33',
          },
        ],
        privateKey: keys[0].privateKey,
      });
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INSUFFICIENT_FUNDS');
    }
  });

  test('claimAll', async () => {
    const result = await client.claimAll({ privateKey: keys[0].privateKey });

    expect(result).toEqual(txid);
    expect(client.claimRaw).toHaveBeenCalledTimes(1);
    expect(client.claimRaw.mock.calls[0][0]).toMatchSnapshot();
  });

  test('invoke', async () => {
    const stack = [{}];
    // $FlowFixMe
    client._testInvocation = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.HALT,
        gas_consumed: '10',
        stack,
      }),
    );
    // $FlowFixMe
    client.invokeRaw = jest.fn(() => Promise.resolve(txid));
    const sendTransactionBase = jest.spyOn(client, '_sendTransactionBase');

    const result = await client.invoke({
      script: Buffer.alloc(1, 0),
      transfers: [
        {
          to: keys[1].address,
          asset: assetHash,
          amount: '21',
        },
      ],
      privateKey: {
        publicKey: keys[0].publicKey,
        // eslint-disable-next-line
        sign: (message: string) => Promise.resolve(''),
      },
    });

    expect(result.txid).toEqual(txid);
    expect(result.stack).toBe(stack);
    expect(sendTransactionBase).toHaveBeenCalledTimes(1);
    expect(sendTransactionBase.mock.calls[0]).toMatchSnapshot();
    expect(client._testInvocation).toHaveBeenCalledTimes(1);
    expect(client._testInvocation.mock.calls[0][0]).toMatchSnapshot();
    expect(client.invokeRaw).toHaveBeenCalledTimes(1);
    expect(client.invokeRaw.mock.calls[0][0]).toMatchSnapshot();
  });

  test('invoke with gas', async () => {
    const stack = [{}];
    // $FlowFixMe
    client._testInvocation = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.HALT,
        gas_consumed: '10',
        stack,
      }),
    );
    // $FlowFixMe
    client._sendTransactionRaw = jest.fn(() => Promise.resolve());
    const sendTransactionBase = jest.spyOn(client, '_sendTransactionBase');

    const result = await client.invoke({
      script: Buffer.alloc(1, 0),
      transfers: [
        {
          to: keys[1].address,
          asset: assetHash,
          amount: '21',
        },
      ],
      privateKey: {
        publicKey: keys[0].publicKey,
        // eslint-disable-next-line
        sign: (message: string) => Promise.resolve(''),
      },
      gas: '10',
    });

    expect(result.txid).toMatchSnapshot();
    expect(result.stack).toBe(stack);
    expect(sendTransactionBase).toHaveBeenCalledTimes(1);
    expect(sendTransactionBase.mock.calls[0]).toMatchSnapshot();
    expect(client._testInvocation).toHaveBeenCalledTimes(1);
    expect(client._testInvocation.mock.calls[0][0]).toMatchSnapshot();
    expect(client._sendTransactionRaw).toHaveBeenCalledTimes(1);
    expect(client._sendTransactionRaw.mock.calls[0][0]).toMatchSnapshot();
  });

  test('invoke throws result error', async () => {
    const message = 'some error';
    // $FlowFixMe
    client._testInvocation = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.FAULT,
        message,
      }),
    );

    try {
      await client.invoke({
        script: Buffer.alloc(1, 0),
        privateKey: keys[0].privateKey,
      });
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.message).toEqual(message);
      expect(error.code).toEqual('INVOKE');
    }
  });

  const hash = keys[0].scriptHash;
  const method = 'foobarFunc';
  const params = [
    '0xfoobar',
    10,
    '100000',
    new BigNumber('100'),
    keys[0].scriptHash,
    Buffer.alloc(10, 1),
    assetHash,
  ];
  test('invokeMethod', async () => {
    const stack = [{}];
    // $FlowFixMe
    client._testInvocation = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.HALT,
        gas_consumed: '10',
        stack,
      }),
    );
    // $FlowFixMe
    client.invokeRaw = jest.fn(() => Promise.resolve(txid));

    const result = await client.invokeMethod({
      hash,
      method,
      params,
      privateKey: {
        publicKey: keys[0].publicKey,
        // eslint-disable-next-line
        sign: (message: string) => Promise.resolve(''),
      },
    });

    expect(result.txid).toEqual(txid);
    expect(result.stack).toBe(stack);
    expect(client._testInvocation).toHaveBeenCalledTimes(1);
    expect(client._testInvocation.mock.calls[0][0]).toMatchSnapshot();
    expect(client.invokeRaw).toHaveBeenCalledTimes(1);
    expect(client.invokeRaw.mock.calls[0][0]).toMatchSnapshot();
  });

  test('testInvoke', async () => {
    const expected = {};
    // $FlowFixMe
    client._testInvokeInternal = jest.fn(() => ({ result: expected }));

    const result = await client.testInvoke({
      script: Buffer.alloc(1, 0),
      privateKey: keys[0].privateKey,
    });

    expect(result).toBe(expected);
    expect(client._testInvokeInternal).toHaveBeenCalledTimes(1);
    expect(client._testInvokeInternal.mock.calls[0][0]).toMatchSnapshot();
  });

  test('testInvokeMethod', async () => {
    const expected = {};
    // $FlowFixMe
    client.testInvoke = jest.fn(() => expected);

    const result = await client.testInvokeMethod({
      hash: keys[0].scriptHash,
      method: 'foo',
      params: [],
      privateKey: keys[0].privateKey,
    });

    expect(result).toBe(expected);
    expect(client.testInvoke).toHaveBeenCalledTimes(1);
    expect(client.testInvoke.mock.calls[0][0]).toMatchSnapshot();
  });

  test('publish', async () => {
    // $FlowFixMe
    client.invoke = jest.fn(() => Promise.resolve({ txid }));

    const result = await client.publish({
      contract: contractLike,
      privateKey: keys[0].privateKey,
    });

    expect(result.txid).toEqual(txid);
    expect(result.hash).toMatchSnapshot();
    expect(client.invoke).toHaveBeenCalledTimes(1);
    expect(client.invoke.mock.calls[0][0]).toMatchSnapshot();
  });

  test('register', async () => {
    // $FlowFixMe
    client.invoke = jest.fn(() => Promise.resolve({ txid }));

    const result = await client.register({
      asset: assetLike,
      privateKey: keys[0].privateKey,
    });

    expect(result).toEqual(txid);
    expect(client.invoke).toHaveBeenCalledTimes(1);
    expect(client.invoke.mock.calls[0][0]).toMatchSnapshot();
  });

  test('issue', async () => {
    // $FlowFixMe
    client.issueRaw = jest.fn(() => Promise.resolve(txid));

    const result = await client.issue({
      issues: [
        {
          to: keys[1].address,
          asset: assetHash,
          amount: '33',
        },
      ],
      privateKey: keys[0].privateKey,
    });

    expect(result).toEqual(txid);
    expect(client.issueRaw).toHaveBeenCalledTimes(1);
    expect(client.issueRaw.mock.calls[0][0]).toMatchSnapshot();
  });

  test('_issueGASFee', () => {
    const mainClient = new Client({ type: 'main' });
    expect(mainClient._issueGASFee).toMatchSnapshot();

    const testClient = new Client({ type: 'test' });
    expect(testClient._issueGASFee).toMatchSnapshot();
  });
});
