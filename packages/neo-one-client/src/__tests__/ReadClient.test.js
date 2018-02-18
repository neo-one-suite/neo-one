/* @flow */

import ReadClient from '../ReadClient';
import * as assertArgs from '../args';
import createReadSmartContract from '../sc/createReadSmartContract';

jest.mock('../sc/createReadSmartContract');

describe('ReadClient', () => {
  let readClient = new ReadClient(({}: $FlowFixMe));
  let provider = readClient.dataProvider;
  beforeEach(() => {
    // $FlowFixMe
    readClient = new ReadClient({});
    provider = readClient.dataProvider;
  });

  const expected = '10';
  const dummyArg = 5;

  const testCases = [
    {
      method: 'getAccount',
      asserts: ['assertAddress'],
      args: [dummyArg],
    },
    {
      method: 'getAsset',
      asserts: ['assertHash256'],
      args: [dummyArg],
    },
    {
      method: 'getBlock',
      asserts: ['assertHash256'],
      args: [dummyArg],
    },
    {
      method: 'getBlock',
      asserts: ['assertGetOptions'],
      args: [dummyArg.toString()],
    },
    {
      method: 'iterBlocks',
      asserts: ['assertBlockFilter'],
      args: [dummyArg],
    },
    {
      method: 'getBestBlockHash',
      asserts: [],
      args: [dummyArg],
    },
    {
      method: 'getBlockCount',
      asserts: [],
      args: [dummyArg],
    },
    {
      method: 'getContract',
      asserts: ['assertHash160'],
      args: [dummyArg],
    },
    {
      method: 'getMemPool',
      asserts: [],
      args: [dummyArg],
    },
    {
      method: 'getTransaction',
      asserts: ['assertHash256'],
      args: [dummyArg],
    },
    {
      method: 'getValidators',
      asserts: [],
      args: [dummyArg],
    },
    {
      method: 'getConnectedPeers',
      asserts: [],
      args: [dummyArg],
    },
    {
      method: '_getStorage',
      asserts: ['assertHash160', 'assertBuffer'],
      args: [dummyArg],
    },
    {
      method: '_iterStorage',
      asserts: ['assertHash160'],
      args: [dummyArg],
    },
    {
      method: '_iterActionsRaw',
      asserts: ['assertBlockFilter'],
      args: [dummyArg],
    },
    {
      method: '_call',
      asserts: [],
      args: [dummyArg, dummyArg.toString(), [dummyArg]],
    },
  ];

  for (const testCase of testCases) {
    const { method, asserts, args } = testCase;
    let providerMethod = method;
    if (method.charAt(0) === '_') {
      providerMethod = method.slice(1);
    }
    // eslint-disable-next-line
    test(method, async () => {
      for (const assert of asserts) {
        // $FlowFixMe
        assertArgs[assert] = jest.fn(() => expected);
      }

      provider[providerMethod] = jest.fn(() => expected);
      // $FlowFixMe
      const result = readClient[method](...args);

      expect(result).toEqual(expected);
    });
  }

  test('smartContract', () => {
    // $FlowFixMe
    assertArgs.assertHash160 = jest.fn(() => expected);
    // $FlowFixMe
    assertArgs.assertABI = jest.fn(() => expected);
    // $FlowFixMe
    createReadSmartContract.mockImplementation(() => expected);

    const result = readClient.smartContract(
      dummyArg.toString(),
      (dummyArg: $FlowFixMe),
    );

    expect(result).toEqual(expected);
  });
});
