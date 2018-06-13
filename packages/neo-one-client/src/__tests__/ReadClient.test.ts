import * as assertArgs from '../args';
import { ReadClient } from '../ReadClient';
import { createReadSmartContract } from '../sc/createReadSmartContract';

jest.mock('../sc/createReadSmartContract');

describe('ReadClient', () => {
  let readClient = new ReadClient({} as any);
  let provider = readClient.dataProvider;
  beforeEach(() => {
    readClient = new ReadClient({} as any);
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
      method: 'getStorage',
      asserts: ['assertHash160', 'assertBuffer'],
      args: [dummyArg],
    },

    {
      method: 'iterStorage',
      asserts: ['assertHash160'],
      args: [dummyArg],
    },

    {
      method: 'iterActionsRaw',
      asserts: ['assertBlockFilter'],
      args: [dummyArg],
    },

    {
      method: 'call',
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

    test(method, async () => {
      for (const assert of asserts) {
        (assertArgs as any)[assert] = jest.fn(() => expected);
      }

      provider[providerMethod] = jest.fn(() => expected);

      const result = (readClient as any)[method](...args);

      expect(result).toEqual(expected);
    });
  }

  test('smartContract', () => {
    (assertArgs as any).assertHash160 = jest.fn(() => expected);
    (assertArgs as any).assertABI = jest.fn(() => expected);

    (createReadSmartContract as any).mockImplementation(() => expected);

    const result = readClient.smartContract(
      dummyArg.toString(),
      dummyArg as any,
    );

    expect(result).toEqual(expected);
  });
});
