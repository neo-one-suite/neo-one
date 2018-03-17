/* @flow */
import BN from 'bn.js';
import { VM_STATE } from '@neo-one/client-core';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import BigNumber from 'bignumber.js';

import { toArray } from 'ix/asynciterable/toarray';

import NEOONEDataProvider from '../../../provider/neoone/NEOONEDataProvider';

import { keys, transactions } from '../../../__data__';

function createExpectedInvocationResult(options: Object) {
  const result = {
    state: 'HALT',
    gasConsumed: new BigNumber('0'),
    stack: [
      { type: 'Integer', value: new BN(1) },
      { type: 'Array', value: [{ type: 'Void' }] },
    ],
  };

  if (options) {
    for (const option of Object.keys(options)) {
      result[option] = options[option];
    }
  }

  return result;
}

function createInvocationResultJSON(options: Object) {
  const result = {
    state: VM_STATE.HALT,
    gas_consumed: '0',
    stack: [
      { type: 'Integer', value: '1' },
      { type: 'Array', value: [{ type: 'Void' }] },
    ],
  };

  if (options) {
    for (const option of Object.keys(options)) {
      result[option] = options[option];
    }
  }

  return result;
}

function createExpectedAsset(options: Object) {
  const asset = {
    type: 'Token',
    name: '0',
    amount: new BigNumber('1'),
    precision: 1,
    owner: '2',
    admin: '3',
    hash: '4',
    issuer: '5',
    expiration: 2,
    available: new BigNumber('6'),
    frozen: true,
  };

  if (options) {
    for (const option of Object.keys(options)) {
      asset[option] = options[option];
    }
  }

  return asset;
}

function createAssetJSON(options: Object) {
  const asset = {
    version: 0,
    type: 'Token',
    name: '0',
    amount: '1',
    precision: 1,
    owner: '2',
    admin: '3',
    id: '4',
    issuer: '5',
    expiration: 2,
    available: '6',
    frozen: true,
  };

  if (options) {
    for (const option of Object.keys(options)) {
      asset[option] = options[option];
    }
  }

  return asset;
}

function createExpectedContract(options: Object) {
  const contract = {
    version: 0,
    hash: '0',
    script: '1',
    parameters: [0],
    returnType: 'Void',
    name: '2',
    codeVersion: '3',
    author: '4',
    email: '5',
    description: '6',
    properties: {
      storage: true,
      dynamicInvoke: false,
    },
  };

  if (options) {
    for (const option of Object.keys(options)) {
      contract[option] = options[option];
    }
  }

  return contract;
}

function createContractJSON(options: Object) {
  const contract = {
    version: 0,
    hash: '0',
    script: '1',
    parameters: [0],
    returntype: 'Void',
    name: '2',
    code_version: '3',
    author: '4',
    email: '5',
    description: '6',
    properties: {
      storage: true,
      dynamic_invoke: false,
    },
  };

  if (options) {
    for (const option of Object.keys(options)) {
      contract[option] = options[option];
    }
  }

  return contract;
}

function createExpectedInvocationData(options: Object) {
  const invocation = {
    result: createExpectedInvocationResult({}),
    asset: createExpectedAsset({}),
    contracts: [createExpectedContract({})],
    deletedContractHashes: ['0'],
    migratedContractHashes: [['1', '2']],
    voteUpdates: [['3', ['4']]],
    actions: [
      {
        type: 'Log',
        message: '0',
        version: 0,
        blockIndex: 1,
        blockHash: '1',
        transactionIndex: 2,
        transactionHash: '2',
        index: 3,
        scriptHash: '3',
      },
      {
        type: 'Notification',
        args: [],
        version: 0,
        blockIndex: 1,
        blockHash: '0',
        transactionIndex: 2,
        transactionHash: '1',
        index: 3,
        scriptHash: '2',
      },
    ],
  };

  if (options) {
    for (const option of Object.keys(options)) {
      invocation[option] = options[option];
    }
  }

  return invocation;
}

function createInvocationDataJSON(options: Object) {
  const invocation = {
    result: createInvocationResultJSON({}),
    asset: createAssetJSON({}),
    contracts: [createContractJSON({})],
    deletedContractHashes: ['0'],
    migratedContractHashes: [['1', '2']],
    voteUpdates: [['3', ['4']]],
    actions: [
      {
        type: 'Log',
        message: '0',
        version: 0,
        blockIndex: 1,
        blockHash: '1',
        transactionIndex: 2,
        transactionHash: '2',
        index: 3,
        scriptHash: '3',
      },
      {
        type: 'Notification',
        args: [],
        version: 0,
        blockIndex: 1,
        blockHash: '0',
        transactionIndex: 2,
        transactionHash: '1',
        index: 3,
        scriptHash: '2',
      },
    ],
  };

  if (options) {
    for (const option of Object.keys(options)) {
      invocation[option] = options[option];
    }
  }

  return invocation;
}

function createAttributeJSON(options: Object) {
  const attribute = {
    usage: 'Vote',
    data: '0',
  };

  if (options) {
    for (const option of Object.keys(options)) {
      attribute[option] = options[option];
    }
  }

  return attribute;
}

function createOutputJSON(options: Object) {
  const output = {
    n: 0,
    asset: '0',
    value: '1',
    address: '2',
  };

  if (options) {
    for (const option of Object.keys(options)) {
      output[option] = options[option];
    }
  }

  return output;
}

function createExpectedOutput(options: Object) {
  const output = {
    asset: '0',
    value: new BigNumber('1'),
    address: '2',
  };

  if (options) {
    for (const option of Object.keys(options)) {
      output[option] = options[option];
    }
  }

  return output;
}

function createTransactionJSON(type: string, options: Object) {
  const transaction = {
    type,
    txid: '0',
    size: 0,
    version: 1,
    attributes: [createAttributeJSON({})],
    vin: [1],
    vout: [createOutputJSON({})],
    scripts: [3],
    sys_fee: '1',
    net_fee: '2',
  };

  if (options) {
    for (const option of Object.keys(options)) {
      transaction[option] = options[option];
    }
  }

  return transaction;
}

function createExpectedTransaction(type: string, options: Object) {
  const transaction = {
    type,
    txid: '0',
    size: 0,
    version: 1,
    attributes: [createAttributeJSON({})],
    vin: [1],
    vout: [createExpectedOutput({})],
    scripts: [3],
    systemFee: new BigNumber('1'),
    networkFee: new BigNumber('2'),
  };

  if (options) {
    for (const option of Object.keys(options)) {
      transaction[option] = options[option];
    }
  }

  return transaction;
}

function createExpectedRegisterTransaction(nameOption: Object) {
  const { type, name, amount, precision, owner, admin } = createExpectedAsset(
    nameOption,
  );
  return createExpectedTransaction('RegisterTransaction', {
    asset: { type, name, amount, precision, owner, admin },
  });
}

function createRegisterTransactionJSON(nameOption: Object) {
  const { type, name, amount, precision, owner, admin } = createAssetJSON(
    nameOption,
  );
  return createTransactionJSON('RegisterTransaction', {
    asset: { type, name, amount, precision, owner, admin },
  });
}

describe('NEOONEDataProvider', () => {
  const network = 'foo';
  const rpcURL = 'bar';
  const iterBlocksFetchTimeoutMS = 1000;

  let provider = new NEOONEDataProvider({
    network,
    rpcURL,
    iterBlocksFetchTimeoutMS,
  });
  beforeEach(() => {
    provider = new NEOONEDataProvider({
      network,
      rpcURL,
      iterBlocksFetchTimeoutMS,
    });
  });

  test('setRPCURL', () => {
    const newRPC = 'buzz';
    provider.setRPCURL(newRPC);
    expect(provider).toMatchSnapshot();
  });

  test('getUnclaimed', async () => {
    const expected = { unclaimed: ['val'], amount: new BigNumber('1') };
    // $FlowFixMe
    provider._client.getAccount = jest.fn(() =>
      Promise.resolve({
        unclaimed: ['val'],
      }),
    );
    // $FlowFixMe
    provider._client.getClaimAmount = jest.fn(() =>
      Promise.resolve([new BigNumber('1')]),
    );

    const result = await provider.getUnclaimed(keys[0].address);
    expect(result).toEqual(expected);
  });

  test('getUnspentOutputs', async () => {
    const expected = [
      {
        asset: '',
        value: new BigNumber('0'),
        address: '',
        txid: '',
        vout: 0,
      },
    ];
    // $FlowFixMe
    provider._client.getAccount = jest.fn(() =>
      Promise.resolve({
        unspent: [
          {
            txid: '',
            vout: 0,
          },
          null,
        ],
      }),
    );
    // $FlowFixMe
    provider._client.getUnspentOutput = jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({
          asset: '',
          value: '0',
          address: '',
        }),
      )
      .mockReturnValueOnce(null);

    const result = await provider.getUnspentOutputs(keys[0].address);
    expect(result).toEqual(expected);
    expect(provider._client.getUnspentOutput).toHaveBeenCalledTimes(2);
  });

  describe('_ConvertTransactionBase types', () => {
    const testCases = [
      {
        expected: createExpectedTransaction('MinerTransaction', { nonce: 10 }),
        transactionJSON: createTransactionJSON('MinerTransaction', {
          nonce: 10,
        }),
      },
      {
        expected: createExpectedTransaction('ClaimTransaction', { claims: [] }),
        transactionJSON: createTransactionJSON('ClaimTransaction', {
          claims: [],
        }),
      },
      {
        expected: createExpectedTransaction('ContractTransaction', {}),
        transactionJSON: createTransactionJSON('ContractTransaction', {}),
      },
      {
        expected: createExpectedTransaction('EnrollmentTransaction', {
          publicKey: '0',
        }),
        transactionJSON: createTransactionJSON('EnrollmentTransaction', {
          pubkey: '0',
        }),
      },
      {
        expected: createExpectedTransaction('IssueTransaction', {}),
        transactionJSON: createTransactionJSON('IssueTransaction', {}),
      },
      {
        expected: createExpectedTransaction('PublishTransaction', {
          contract: createExpectedContract({}),
        }),
        transactionJSON: createTransactionJSON('PublishTransaction', {
          contract: createContractJSON({}),
        }),
      },
      {
        expected: createExpectedRegisterTransaction({ name: '10' }),
        transactionJSON: createRegisterTransactionJSON({ name: '10' }),
      },
      {
        expected: createExpectedRegisterTransaction({ name: '10' }),
        transactionJSON: createRegisterTransactionJSON({
          name: [{ name: '10' }],
        }),
      },
      {
        expected: createExpectedTransaction('StateTransaction', {
          descriptors: '10',
        }),
        transactionJSON: createTransactionJSON('StateTransaction', {
          descriptors: '10',
        }),
      },
      {
        expected: createExpectedTransaction('InvocationTransaction', {
          gas: new BigNumber('10'),
          script: '11',
        }),
        transactionJSON: createTransactionJSON('InvocationTransaction', {
          gas: '10',
          script: '11',
        }),
      },
    ];

    for (const testCase of testCases) {
      const { expected, transactionJSON } = testCase;
      // eslint-disable-next-line
      test(`relayTransaction with ${transactionJSON.type}`, async () => {
        // $FlowFixMe
        provider._client.relayTransaction = jest.fn(() =>
          Promise.resolve(transactionJSON),
        );

        const result = await provider.relayTransaction('');
        expect(result).toEqual(expected);
      });
    }
  });

  test('getTransactionReceipt', async () => {
    const expected = '';
    // $FlowFixMe
    provider._client.getTransactionReceipt = jest.fn(() =>
      Promise.resolve(expected),
    );

    const result = provider.getTransactionReceipt(transactions.register.hash);
    expect(result).resolves.toEqual(expected);
  });

  test('getInvocationData', async () => {
    const expected = createExpectedInvocationData({});
    // $FlowFixMe
    provider._client.getInvocationData = jest.fn(() =>
      Promise.resolve(createInvocationDataJSON({})),
    );

    const result = await provider.getInvocationData(transactions.register.hash);
    expect(result).toEqual(expected);
  });

  test('testInvoke', async () => {
    const expected = createExpectedInvocationResult({
      state: 'FAULT',
      message: '10',
    });
    // $FlowFixMe
    provider._client.testInvocation = jest.fn(() =>
      Promise.resolve(
        createInvocationResultJSON({ state: VM_STATE.FAULT, message: '10' }),
      ),
    );

    const result = provider.testInvoke('');
    expect(result).resolves.toEqual(expected);
  });

  test('getAccount', async () => {
    const expected = {
      address: keys[0].address,
      frozen: false,
      votes: 0,
      balances: { coin: new BigNumber('0') },
    };
    // $FlowFixMe
    provider._client.getAccount = jest.fn(() =>
      Promise.resolve({
        frozen: false,
        votes: 0,
        balances: [{ asset: 'coin', value: '0' }],
      }),
    );

    const result = provider.getAccount(keys[0].address);
    expect(result).resolves.toEqual(expected);
  });

  test('getAsset with multiple languages', async () => {
    const expected = createExpectedAsset({ name: 'blarg' });
    // $FlowFixMe
    provider._client.getAsset = jest.fn(() =>
      Promise.resolve(
        createAssetJSON({ name: [{ lang: 'en', name: 'blarg' }] }),
      ),
    );

    const result = provider.getAsset(transactions.register.hash);
    expect(result).resolves.toEqual(expected);
  });

  test('getAsset with multiple languages - no english name', async () => {
    const expected = createExpectedAsset({ name: 'blarg' });
    // $FlowFixMe
    provider._client.getAsset = jest.fn(() =>
      Promise.resolve(
        createAssetJSON({ name: [{ lang: 'bl', name: 'blarg' }] }),
      ),
    );

    const result = provider.getAsset(transactions.register.hash);
    expect(result).resolves.toEqual(expected);
  });

  test('getBlock', async () => {
    const expected = {
      version: 0,
      hash: '',
      previousBlockHash: '0',
      merkleRoot: '1',
      time: 1,
      index: 2,
      nonce: '2',
      nextConsensus: '3',
      script: { invocation: '4', verification: '5' },
      size: 3,
      transactions: [
        createExpectedTransaction('InvocationTransaction', {
          gas: new BigNumber('10'),
          script: '11',
          data: createExpectedInvocationData({ asset: null }),
        }),
      ],
    };
    // $FlowFixMe
    provider._client.getBlock = jest.fn(() =>
      Promise.resolve({
        version: 0,
        hash: '',
        previousblockhash: '0',
        merkleroot: '1',
        time: 1,
        index: 2,
        nonce: '2',
        nextconsensus: '3',
        script: { invocation: '4', verification: '5' },
        size: 3,
        confirmations: 4,
        tx: [
          createTransactionJSON('InvocationTransaction', {
            gas: '10',
            script: '11',
            data: createInvocationDataJSON({ asset: null }),
          }),
        ],
      }),
    );

    const result = provider.getBlock(transactions.register.hash);
    await expect(result).resolves.toEqual(expected);
  });

  test('getBestBlockHash', async () => {
    const expected = {};
    // $FlowFixMe
    provider._client.getBestBlockHash = jest.fn(() => Promise.resolve({}));

    const result = provider.getBestBlockHash();
    await expect(result).resolves.toEqual(expected);
  });

  test('getBlockCount', async () => {
    const expected = {};
    // $FlowFixMe
    provider._client.getBlockCount = jest.fn(() => Promise.resolve({}));

    const result = provider.getBlockCount();
    await expect(result).resolves.toEqual(expected);
  });

  test('getContract', async () => {
    const expected = createExpectedContract({});
    // $FlowFixMe
    provider._client.getContract = jest.fn(() =>
      Promise.resolve(createContractJSON({})),
    );

    const result = provider.getContract(transactions.register.hash);
    await expect(result).resolves.toEqual(expected);
  });

  test('getMemPool', async () => {
    const expected = {};
    // $FlowFixMe
    provider._client.getMemPool = jest.fn(() => Promise.resolve({}));

    const result = provider.getMemPool();
    await expect(result).resolves.toEqual(expected);
  });

  test('getValidators', async () => {
    const expected = [
      {
        version: 0,
        publicKey: '0',
        registered: true,
        votes: new BigNumber('1'),
      },
    ];
    // $FlowFixMe
    provider._client.getValidators = jest.fn(() =>
      Promise.resolve([
        {
          version: 0,
          publicKey: '0',
          registered: true,
          votes: '1',
        },
      ]),
    );

    const result = provider.getValidators();
    await expect(result).resolves.toEqual(expected);
  });

  test('getConnectedPeers', async () => {
    const expected = {};
    // $FlowFixMe
    provider._client.getConnectedPeers = jest.fn(() => Promise.resolve({}));

    const result = provider.getConnectedPeers();
    await expect(result).resolves.toEqual(expected);
  });

  test('getTransaction', async () => {
    const expected = createExpectedTransaction('ClaimTransaction', {});
    // $FlowFixMe
    provider._client.getTransaction = jest.fn(() =>
      Promise.resolve(createTransactionJSON('ClaimTransaction', {})),
    );

    const result = provider.getTransaction(transactions.register.hash);
    await expect(result).resolves.toEqual(expected);
  });

  test('getNetworkSettings', async () => {
    const expected = { issueGASFee: new BigNumber('0') };
    // $FlowFixMe
    provider._client.getNetworkSettings = jest.fn(() =>
      Promise.resolve({ issueGASFee: '0' }),
    );

    const result = provider.getNetworkSettings();
    expect(result).resolves.toEqual(expected);
  });

  test('_convertConfirmedTransaction throws null data error', async () => {
    function testError() {
      // $FlowFixMe
      provider._convertConfirmedTransaction(
        // $FlowFixMe
        createTransactionJSON('InvocationTransaction', { data: null }),
      );
    }
    expect(testError).toThrow(new Error('Unexpected null data'));
  });

  test('getStorage', async () => {
    const expected = {};
    // $FlowFixMe
    provider._client.getStorageItem = jest.fn(() => Promise.resolve({}));

    const result = provider.getStorage(transactions.register.hash, '');
    await expect(result).resolves.toEqual(expected);
  });

  test('iterStorage', async () => {
    const storage = { hash: '0', key: '1', value: '2' };
    // $FlowFixMe
    const expected = [storage];
    // $FlowFixMe
    provider._client.getAllStorage = jest.fn(() => Promise.resolve([storage]));

    const result = await toArray(
      provider.iterStorage(transactions.register.hash),
    );
    expect(result).toEqual(expected);
  });

  test('iterBlocks - null iterBlocksFetchTimeoutMS', async () => {
    provider = new NEOONEDataProvider({
      network,
      rpcURL,
    });
    const result = provider.iterBlocks({ indexStart: 1, indexStop: 2 });
    expect(result).toMatchSnapshot();
  });

  test('iterBlocks', async () => {
    const result = provider.iterBlocks();
    expect(result).toMatchSnapshot();
  });

  test('iterActions', async () => {
    const expected = ['0'];
    const block = {
      transactions: [
        createTransactionJSON('InvocationTransaction', {
          data: { actions: '0' },
        }),
        createTransactionJSON('ClaimTransaction', {}),
      ],
    };

    // $FlowFixMe
    provider.iterBlocks = jest.fn(() => AsyncIterableX.from([block]));

    const result = await toArray(
      provider.iterActionsRaw({ indexStart: 1, indexStop: 2 }),
    );
    expect(result).toEqual(expected);
  });

  test('iterActions null filter', async () => {
    const expected = ['0'];
    const block = {
      transactions: [
        createTransactionJSON('InvocationTransaction', {
          data: { actions: '0' },
        }),
        createTransactionJSON('ClaimTransaction', {}),
      ],
    };

    // $FlowFixMe
    provider.iterBlocks = jest.fn(() => AsyncIterableX.from([block]));

    const result = await toArray(provider.iterActionsRaw());
    expect(result).toEqual(expected);
  });

  test('call', async () => {
    const contract = '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9';
    const method = 'testMethod';
    const params = ['param1'];

    // $FlowFixMe
    provider._client.testInvocation = jest.fn(() =>
      Promise.resolve(
        createInvocationResultJSON({ state: VM_STATE.FAULT, message: '10' }),
      ),
    );

    const result = await provider.call(contract, method, params);
    expect(result).toMatchSnapshot();
  });

  test('runConsensusNow', () => {
    // $FlowFixMe
    provider._client.runConsensusNow = jest.fn();

    const result = provider.runConsensusNow();

    expect(result).toBeUndefined();
    expect(provider._client.runConsensusNow).toHaveBeenCalledWith(undefined);
    expect(provider._client.runConsensusNow).toHaveBeenCalledTimes(1);
  });

  test('updateSettings', () => {
    const options = { secondsPerBlock: 10 };
    // $FlowFixMe
    provider._client.updateSettings = jest.fn();
    const result = provider.updateSettings(options);

    expect(result).toBeUndefined();
    expect(provider._client.updateSettings).toHaveBeenCalledWith(
      options,
      undefined,
    );
    expect(provider._client.updateSettings).toHaveBeenCalledTimes(1);
  });

  test('fastForwardOffset', () => {
    const offset = 10;
    // $FlowFixMe
    provider._client.fastForwardOffset = jest.fn();
    const result = provider.fastForwardOffset(offset);

    expect(result).toBeUndefined();
    expect(provider._client.fastForwardOffset).toHaveBeenCalledWith(
      offset,
      undefined,
    );
    expect(provider._client.fastForwardOffset).toHaveBeenCalledTimes(1);
  });

  test('fastForwardToTime', () => {
    const time = 10;
    // $FlowFixMe
    provider._client.fastForwardToTime = jest.fn();
    const result = provider.fastForwardToTime(time);

    expect(result).toBeUndefined();
    expect(provider._client.fastForwardToTime).toHaveBeenCalledWith(
      time,
      undefined,
    );
    expect(provider._client.fastForwardToTime).toHaveBeenCalledTimes(1);
  });
});
