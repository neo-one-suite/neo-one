/* @flow */
/* eslint-disable no-loop-func */
import { VM_STATE, utils } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';

import _ from 'lodash';

import AsyncBlockIterator from '../AsyncBlockIterator';
import BasicClientBase from '../BasicClientBase';

import { keys, transactions } from '../__data__';

const getClient = () => {
  const provider = ({}: $FlowFixMe);
  const client = new BasicClientBase({ provider });
  return { provider, client };
};

describe('BasicClientBase abstract methods', () => {
  const abstractMethods = ['contract'];
  const { client } = getClient();

  test('abstract methods throw error', () => {
    for (const method of abstractMethods) {
      // $FlowFixMe
      expect(() => client[method]()).toThrow(); // eslint-disable-line
    }
  });
});

describe('BasicClientBase provider methods', () => {
  const testCases = [
    {
      method: 'getAccount',
      args: [keys[0].address],
    },
    {
      method: 'getAsset',
      args: [transactions.register.hashHex],
    },
    {
      method: 'getBlock',
      args: [transactions.register.hashHex],
    },
    {
      method: 'getBlock',
      args: [0],
    },
    {
      method: 'getBestBlockHash',
      args: [],
    },
    {
      method: 'getBlockCount',
      args: [],
    },
    {
      method: 'getContract',
      args: [keys[0].scriptHash],
    },
    {
      method: 'getMemPool',
      args: [],
    },
    {
      method: 'getTransaction',
      args: [transactions.register.hashHex],
    },
    {
      method: 'getStorage',
      args: [keys[0].scriptHash, '123'],
    },
    {
      method: 'getUnspentOutput',
      args: [
        {
          txid: transactions.register.hashHex,
          vout: 0,
        },
      ],
    },
    {
      method: 'testInvokeRaw',
      args: ['123'],
    },
    {
      method: '_sendTransactionRaw',
      providerMethod: 'sendTransactionRaw',
      args: [Buffer.alloc(0, 0)],
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

const inputID0 =
  '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f79';
const inputID1 =
  '0xba89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f79';
const asset0 =
  '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7';
const asset1 =
  '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';
const value0 = 10;
const value1 = '10';
const address0 = 'AQVh2pG732YvtNaxEGkQUei3YA4cvo7d2i';
const address1 = 'Ae2d6qj91YL3LVUMkza7WQsaTYjzjHm4z1';
const invocation0 = Buffer.from(
  'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
  'hex',
);
const verification0 = Buffer.from(
  '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
  'hex',
);
const signature =
  'ca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f79';
const privateKey0 = keys[0].privateKey;
const privateKey1 = {
  // eslint-disable-next-line
  sign: (message: string) => Promise.resolve(signature),
  publicKey: keys[0].publicKey,
};
const privateKeys = [
  { type: 'pk', privateKey: privateKey0 },
  { type: 'sign', privateKey: privateKey1 },
];

const contractLike = {
  script: invocation0,
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

const hash = keys[0].scriptHash;
const method = 'foobarFunc';
const params = [
  '0xfoobar',
  10,
  '100000',
  new BigNumber('100'),
  keys[0].scriptHash,
  Buffer.alloc(10, 1),
  asset0,
];

const tests = privateKeys.reduce(
  (acc, privateKey) =>
    acc.concat([
      {
        name: 'empty',
        script: Buffer.alloc(1, 0),
        gas: '0',
        contract: contractLike,
        asset: assetLike,
        inputs: undefined,
        outputs: undefined,
        attributes: undefined,
        scripts: undefined,
        privateKey,
      },
      {
        name: 'simple',
        script: invocation0,
        gas: '10',
        contract: contractLike,
        asset: assetLike,
        inputs: [
          {
            txid: inputID0,
            vout: 0,
          },
          {
            txid: inputID1,
            vout: 1,
          },
        ],
        outputs: [
          {
            value: value0,
            asset: asset0,
            address: address0,
          },
        ],
        attributes: [
          {
            usage: 'Script',
            value: address0,
          },
          {
            usage: 'ECDH02',
            value: keys[0].publicKey,
          },
          {
            usage: 'Hash1',
            value: asset0,
          },
          {
            usage: 'Remark',
            value: Buffer.from('foobar', 'ascii').toString('hex'),
          },
        ],
        scripts: [
          {
            invocation: invocation0,
            verification: verification0,
          },
        ],
        privateKey,
      },
      {
        name: 'attributes',
        script: verification0,
        gas: '0.10',
        contract: contractLike,
        asset: assetLike,
        inputs: [
          {
            txid: inputID0,
            vout: 1,
          },
          {
            txid: inputID1,
            vout: 0,
          },
        ],
        outputs: [
          {
            value: value1,
            asset: asset1,
            address: address1,
          },
        ],
        attributes: [
          {
            usage: 'Remark',
            value: Buffer.from('Hello World', 'ascii').toString('hex'),
          },
        ].concat(
          _.range(1, 16).map(
            idx =>
              ({
                usage: `Remark${idx}`,
                value: Buffer.from('Hello World', 'ascii').toString('hex'),
              }: $FlowFixMe),
          ),
        ),
        scripts: [],
        privateKey,
      },
    ]),
  [],
);

describe('BasicClientBase', () => {
  let { client } = getClient();
  beforeEach(() => {
    const result = getClient();
    // eslint-disable-next-line
    client = result.client;
    const originalSend = client._sendTransaction.bind(client);
    // $FlowFixMe
    client._sendTransaction = jest.fn((...args) => originalSend(...args));
    // $FlowFixMe
    client._sendTransactionRaw = jest.fn(() => Promise.resolve());
    // $FlowFixMe
    client.testInvokeRaw = jest.fn(() => ({
      state: VM_STATE.HALT,
      gas_consumed: '1',
      stack: [],
    }));
  });

  test('iterBlocks returns a AsyncBlockIterator', () => {
    const filter = {};
    const blockIterator = new AsyncBlockIterator({ filter, client });
    expect(client.iterBlocks(filter)).toEqual(blockIterator);
  });

  for (const testConfig of tests) {
    const {
      name,
      script,
      gas,
      contract,
      asset,
      inputs,
      outputs,
      attributes,
      scripts,
      privateKey: { type, privateKey },
    } = testConfig;

    const createTest = (testName: string, testFunc: () => Promise<*>) => {
      test(`${testName}-${name}-${type}`, async () => {
        const mock = jest.spyOn(utils, 'randomUInt').mockReturnValue(10);

        const result = await testFunc();

        mock.mockRestore();
        expect(result).toMatchSnapshot();
        expect(client._sendTransaction).toHaveBeenCalledTimes(1);
        expect(client._sendTransaction.mock.calls[0][0]).toMatchSnapshot();
        expect(client._sendTransactionRaw).toHaveBeenCalledTimes(1);
        expect(client._sendTransactionRaw.mock.calls[0]).toMatchSnapshot();
      });
    };

    if (inputs != null && inputs.length > 0) {
      createTest('transferRaw', () =>
        client.transferRaw({
          inputs,
          outputs: outputs || [],
          attributes,
          scripts,
          privateKey,
        }),
      );
    } else {
      test('transferRaw no inputs', async () => {
        try {
          await client.transferRaw({
            inputs: inputs || [],
            outputs: outputs || [],
            attributes,
            scripts,
            privateKey,
          });
          expect(false).toBeTruthy();
        } catch (error) {
          expect(error.code).toEqual('NOTHING_TO_TRANSFER');
        }
      });
    }
    if (inputs != null && inputs.length > 0) {
      createTest('claimRaw', () =>
        client.claimRaw({
          claims: inputs,
          outputs: outputs || [],
          attributes,
          scripts,
          privateKey,
        }),
      );
    } else {
      test('claimRaw no claims', async () => {
        try {
          await client.claimRaw({
            claims: inputs || [],
            outputs: outputs || [],
            attributes,
            scripts,
            privateKey,
          });
          expect(false).toBeTruthy();
        } catch (error) {
          expect(error.code).toEqual('NOTHING_TO_CLAIM');
        }
      });
    }
    createTest('invokeRaw', () =>
      client.invokeRaw({
        script,
        gas,
        inputs,
        outputs,
        attributes,
        scripts,
        privateKey,
      }),
    );
    createTest('invokeMethodRaw', () =>
      client.invokeMethodRaw({
        hash,
        method,
        params,
        gas,
        inputs,
        outputs,
        attributes,
        scripts,
        privateKey,
      }),
    );
    createTest('publishRaw', () =>
      client.publishRaw({
        contract,
        inputs: inputs || [],
        outputs,
        attributes,
        scripts,
        privateKey,
      }),
    );
    createTest('registerRaw', () =>
      client.registerRaw({
        asset,
        inputs: inputs || [],
        outputs,
        attributes,
        scripts,
        privateKey,
      }),
    );
    if (outputs != null && outputs.length > 0) {
      createTest('issueRaw', () =>
        client.issueRaw({
          inputs: inputs || [],
          outputs,
          attributes,
          scripts,
          privateKey,
        }),
      );
    } else {
      test('issueRaw no outputs', async () => {
        try {
          await client.issueRaw({
            inputs: inputs || [],
            outputs: outputs || [],
            attributes,
            scripts,
            privateKey,
          });
          expect(false).toBeTruthy();
        } catch (error) {
          expect(error.code).toEqual('NOTHING_TO_ISSUE');
        }
      });
    }
  }

  test('testInvokeMethodRaw calls testInvokeRaw', async () => {
    const expected = {
      state: VM_STATE.FAULT,
      message: 'Foo!',
    };
    // $FlowFixMe
    client.testInvokeRaw = jest.fn(() => Promise.resolve(expected));

    const result = await client.testInvokeMethodRaw({ hash, method, params });

    expect(result).toEqual(expected);
    expect(client.testInvokeRaw).toHaveBeenCalledTimes(1);
    expect(client.testInvokeRaw.mock.calls[0]).toMatchSnapshot();
  });
});
