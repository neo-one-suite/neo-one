import { VMState } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import { toArray } from 'ix/asynciterable/toarray';
import { keys, transactions } from '../../../__data__';
import { NEOONEDataProvider } from '../../../provider/neoone/NEOONEDataProvider';

function createExpectedInvocationResult(options: object) {
  const result = {
    state: 'HALT',
    gasConsumed: new BigNumber('0'),
    gasCost: new BigNumber('0'),
    stack: [{ type: 'Integer', value: new BN(1) }, { type: 'Array', value: [{ type: 'Void' }] }],
  };

  if (options) {
    for (const option of Object.keys(options)) {
      // @ts-ignore
      result[option] = options[option];
    }
  }

  return result;
}

function createInvocationResultJSON(options: object) {
  const result = {
    state: VMState.Halt,
    gas_consumed: '0',
    gas_cost: '0',
    stack: [{ type: 'Integer', value: '1' }, { type: 'Array', value: [{ type: 'Void' }] }],
  };

  if (options) {
    for (const option of Object.keys(options)) {
      // @ts-ignore
      result[option] = options[option];
    }
  }

  return result;
}

function createExpectedAsset(options: object) {
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
      // @ts-ignore
      asset[option] = options[option];
    }
  }

  return asset;
}

function createAssetJSON(options: object) {
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
      // @ts-ignore
      asset[option] = options[option];
    }
  }

  return asset;
}

function createExpectedContract(options: object) {
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
      payable: true,
    },
  };

  for (const option of Object.keys(options)) {
    // @ts-ignore
    contract[option] = options[option];
  }

  return contract;
}

function createContractJSON(options: object) {
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
      payable: true,
    },
  };

  if (options) {
    for (const option of Object.keys(options)) {
      // @ts-ignore
      contract[option] = options[option];
    }
  }

  return contract;
}

function createExpectedInvocationData(extra: object, options: { hash?: string } = { hash: undefined }) {
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
        blockIndex: 4,
        blockHash: '3',
        transactionIndex: 5,
        transactionHash: options.hash == undefined ? '0' : options.hash,
        index: 0,
        globalIndex: new BigNumber(3),
        scriptHash: '3',
      },

      {
        type: 'Notification',
        args: [],
        version: 0,
        blockIndex: 4,
        blockHash: '3',
        transactionIndex: 5,
        transactionHash: options.hash == undefined ? '0' : options.hash,
        index: 1,
        globalIndex: new BigNumber(4),
        scriptHash: '2',
      },
    ],
  };

  if (extra) {
    for (const option of Object.keys(extra)) {
      // @ts-ignore
      invocation[option] = extra[option];
    }
  }

  return invocation;
}

function createInvocationDataJSON(options: object) {
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
        index: '3',
        scriptHash: '3',
      },

      {
        type: 'Notification',
        args: [],
        version: 0,
        index: '4',
        scriptHash: '2',
      },
    ],
  };

  if (options) {
    for (const option of Object.keys(options)) {
      // @ts-ignore
      invocation[option] = options[option];
    }
  }

  return invocation;
}

function createAttributeJSON(options: object) {
  const attribute = {
    usage: 'Vote',
    data: '0',
  };

  if (options) {
    for (const option of Object.keys(options)) {
      // @ts-ignore
      attribute[option] = options[option];
    }
  }

  return attribute;
}

function createOutputJSON(options: object) {
  const output = {
    n: 0,
    asset: '0',
    value: '1',
    address: '2',
  };

  if (options) {
    for (const option of Object.keys(options)) {
      // @ts-ignore
      output[option] = options[option];
    }
  }

  return output;
}

function createExpectedOutput(options: object) {
  const output = {
    asset: '0',
    value: new BigNumber('1'),
    address: '2',
  };

  if (options) {
    for (const option of Object.keys(options)) {
      // @ts-ignore
      output[option] = options[option];
    }
  }

  return output;
}

function createTransactionJSON(
  type: string,
  extra: object,
  options: { noData?: boolean; hash?: string } = { noData: false },
) {
  const transaction = {
    type,
    txid: options.hash == undefined ? '0' : options.hash,
    size: 0,
    version: 1,
    attributes: [createAttributeJSON({})],
    vin: [1],
    vout: [createOutputJSON({})],
    scripts: [3],
    sys_fee: '1',
    net_fee: '2',
  };

  if (!options.noData) {
    // @ts-ignore
    transaction.data = {
      blockHash: '3',
      blockIndex: 4,
      index: 5,
      globalIndex: '4',
    };
  }

  if (extra) {
    for (const option of Object.keys(extra)) {
      // @ts-ignore
      transaction[option] = extra[option];
    }
  }

  return transaction;
}

function createExpectedTransaction(type: string, extra: object, options: { noData: boolean } = { noData: false }) {
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

  if (!options.noData) {
    // @ts-ignore
    transaction.data = {
      blockHash: '3',
      blockIndex: 4,
      index: 5,
      globalIndex: new BigNumber('4'),
    };
  }

  if (extra) {
    for (const option of Object.keys(extra)) {
      // @ts-ignore
      transaction[option] = extra[option];
    }
  }

  return transaction;
}

function createExpectedRegisterTransaction(nameOption: object, options: { noData: boolean } = { noData: false }) {
  const { type, name, amount, precision, owner, admin } = createExpectedAsset(nameOption);

  return createExpectedTransaction(
    'RegisterTransaction',
    {
      asset: { type, name, amount, precision, owner, admin },
    },

    options,
  );
}

function createRegisterTransactionJSON(nameOption: object) {
  const { type, name, amount, precision, owner, admin } = createAssetJSON(nameOption);

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
    // @ts-ignore
    (provider as any).mutableClient.getAccount = jest.fn(() =>
      Promise.resolve({
        unclaimed: ['val'],
      }),
    );

    // @ts-ignore
    (provider as any).mutableClient.getClaimAmount = jest.fn(() => Promise.resolve([new BigNumber('1')]));

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

    // @ts-ignore
    (provider as any).mutableClient.getAccount = jest.fn(() =>
      Promise.resolve({
        unspent: [
          {
            txid: '',
            vout: 0,
          },

          undefined,
        ],
      }),
    );

    // @ts-ignore
    (provider as any).mutableClient.getUnspentOutput = jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({
          asset: '',
          value: '0',
          address: '',
        }),
      )
      .mockReturnValueOnce(undefined);

    const result = await provider.getUnspentOutputs(keys[0].address);
    expect(result).toEqual(expected);
    expect((provider as any).mutableClient.getUnspentOutput).toHaveBeenCalledTimes(2);
  });

  describe('_ConvertTransactionBase types', () => {
    const testCases = [
      {
        expected: createExpectedTransaction('MinerTransaction', { nonce: 10 }, { noData: true }),

        transactionJSON: createTransactionJSON('MinerTransaction', {
          nonce: 10,
        }),
      },

      {
        expected: createExpectedTransaction('ClaimTransaction', { claims: [] }, { noData: true }),

        transactionJSON: createTransactionJSON('ClaimTransaction', {
          claims: [],
        }),
      },

      {
        expected: createExpectedTransaction('ContractTransaction', {}, { noData: true }),

        transactionJSON: createTransactionJSON('ContractTransaction', {}),
      },

      {
        expected: createExpectedTransaction(
          'EnrollmentTransaction',
          {
            publicKey: '0',
          },

          { noData: true },
        ),

        transactionJSON: createTransactionJSON('EnrollmentTransaction', {
          pubkey: '0',
        }),
      },

      {
        expected: createExpectedTransaction('IssueTransaction', {}, { noData: true }),

        transactionJSON: createTransactionJSON('IssueTransaction', {}),
      },

      {
        expected: createExpectedTransaction(
          'PublishTransaction',
          {
            contract: createExpectedContract({}),
          },

          { noData: true },
        ),

        transactionJSON: createTransactionJSON('PublishTransaction', {
          contract: createContractJSON({}),
        }),
      },

      {
        expected: createExpectedRegisterTransaction({ name: '10' }, { noData: true }),

        transactionJSON: createRegisterTransactionJSON({ name: '10' }),
      },

      {
        expected: createExpectedRegisterTransaction({ name: '10' }, { noData: true }),

        transactionJSON: createRegisterTransactionJSON({
          name: [{ name: '10' }],
        }),
      },

      {
        expected: createExpectedTransaction(
          'StateTransaction',
          {
            descriptors: '10',
          },

          { noData: true },
        ),

        transactionJSON: createTransactionJSON('StateTransaction', {
          descriptors: '10',
        }),
      },

      {
        expected: createExpectedTransaction(
          'InvocationTransaction',
          {
            gas: new BigNumber('10'),
            script: '11',
          },

          { noData: true },
        ),

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
        // @ts-ignore
        (provider as any).mutableClient.relayTransaction = jest.fn(() => Promise.resolve(transactionJSON));

        const result = await provider.relayTransaction('');
        expect(result).toEqual(expected);
      });
    }
  });

  test('getTransactionReceipt', async () => {
    const expected = '';
    // @ts-ignore
    (provider as any).mutableClient.getTransactionReceipt = jest.fn(() => Promise.resolve(expected));

    const result = provider.getTransactionReceipt((transactions as any).register.hash);
    expect(result).resolves.toEqual(expected);
  });

  test('getInvocationData', async () => {
    const expected = createExpectedInvocationData({}, { hash: (transactions as any).register.hash });

    // @ts-ignore
    (provider as any).mutableClient.getInvocationData = jest.fn(() => Promise.resolve(createInvocationDataJSON({})));

    // @ts-ignore
    (provider as any).mutableClient.getTransaction = jest.fn(() =>
      Promise.resolve(
        createTransactionJSON('InvocationTransaction', {}, { hash: (transactions as any).register.hash }),
      ),
    );

    const result = await provider.getInvocationData((transactions as any).register.hash);
    expect(result).toEqual(expected);
  });

  test('testInvoke', async () => {
    const expected = createExpectedInvocationResult({
      state: 'FAULT',
      message: '10',
    });

    // @ts-ignore
    (provider as any).mutableClient.testInvocation = jest.fn(() =>
      Promise.resolve(createInvocationResultJSON({ state: VMState.Fault, message: '10' })),
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

    // @ts-ignore
    (provider as any).mutableClient.getAccount = jest.fn(() =>
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
    // @ts-ignore
    (provider as any).mutableClient.getAsset = jest.fn(() =>
      Promise.resolve(createAssetJSON({ name: [{ lang: 'en', name: 'blarg' }] })),
    );

    const result = provider.getAsset((transactions as any).register.hash);
    expect(result).resolves.toEqual(expected);
  });

  test('getAsset with multiple languages - no english name', async () => {
    const expected = createExpectedAsset({ name: 'blarg' });
    // @ts-ignore
    (provider as any).mutableClient.getAsset = jest.fn(() =>
      Promise.resolve(createAssetJSON({ name: [{ lang: 'bl', name: 'blarg' }] })),
    );

    const result = provider.getAsset((transactions as any).register.hash);
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
          invocationData: createExpectedInvocationData({ asset: undefined }),
        }),
      ],
    };

    // @ts-ignore
    (provider as any).mutableClient.getBlock = jest.fn(() =>
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
            invocationData: createInvocationDataJSON({ asset: undefined }),
          }),
        ],
      }),
    );

    const result = provider.getBlock((transactions as any).register.hash);
    await expect(result).resolves.toEqual(expected);
  });

  test('getBestBlockHash', async () => {
    const expected = {};
    // @ts-ignore
    (provider as any).mutableClient.getBestBlockHash = jest.fn(() => Promise.resolve({}));

    const result = provider.getBestBlockHash();
    await expect(result).resolves.toEqual(expected);
  });

  test('getBlockCount', async () => {
    const expected = {};
    // @ts-ignore
    (provider as any).mutableClient.getBlockCount = jest.fn(() => Promise.resolve({}));

    const result = provider.getBlockCount();
    await expect(result).resolves.toEqual(expected);
  });

  test('getContract', async () => {
    const expected = createExpectedContract({});
    // @ts-ignore
    (provider as any).mutableClient.getContract = jest.fn(() => Promise.resolve(createContractJSON({})));

    const result = provider.getContract((transactions as any).register.hash);
    await expect(result).resolves.toEqual(expected);
  });

  test('getMemPool', async () => {
    const expected = {};
    // @ts-ignore
    (provider as any).mutableClient.getMemPool = jest.fn(() => Promise.resolve({}));

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

    // @ts-ignore
    (provider as any).mutableClient.getValidators = jest.fn(() =>
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
    // @ts-ignore
    (provider as any).mutableClient.getConnectedPeers = jest.fn(() => Promise.resolve({}));

    const result = provider.getConnectedPeers();
    await expect(result).resolves.toEqual(expected);
  });

  test('getTransaction', async () => {
    const expected = createExpectedTransaction('ClaimTransaction', { claims: [] }, { noData: true });

    // @ts-ignore
    (provider as any).mutableClient.getTransaction = jest.fn(() =>
      Promise.resolve(createTransactionJSON('ClaimTransaction', { claims: [] }, { noData: true })),
    );

    const result = provider.getTransaction((transactions as any).register.hash);
    await expect(result).resolves.toEqual(expected);
  });

  test('getNetworkSettings', async () => {
    const expected = { issueGASFee: new BigNumber('0') };
    // @ts-ignore
    (provider as any).mutableClient.getNetworkSettings = jest.fn(() => Promise.resolve({ issueGASFee: '0' }));

    const result = provider.getNetworkSettings();
    expect(result).resolves.toEqual(expected);
  });

  test('_convertConfirmedTransaction throws undefined data error', async () => {
    function testError() {
      // @ts-ignore
      provider.convertConfirmedTransaction(
        // @ts-ignore
        createTransactionJSON('ContractTransaction', { data: undefined }),
      );
    }
    expect(testError).toThrow(new Error('Unexpected undefined data') as any);
  });

  test('_convertConfirmedTransaction with InvocationTransaction throws undefined data error', async () => {
    function testError() {
      // @ts-ignore
      provider.convertConfirmedTransaction(
        // @ts-ignore
        createTransactionJSON('InvocationTransaction', {
          invocationData: undefined,
        }),
      );
    }
    expect(testError).toThrow(new Error('Unexpected undefined data') as any);
  });

  test('getStorage', async () => {
    const expected = {};
    // @ts-ignore
    (provider as any).mutableClient.getStorageItem = jest.fn(() => Promise.resolve({}));

    const result = provider.getStorage((transactions as any).register.hash, '');
    await expect(result).resolves.toEqual(expected);
  });

  test('iterStorage', async () => {
    const storage = { hash: '0', key: '1', value: '2' };
    // @ts-ignore
    const expected = [storage];
    // @ts-ignore
    (provider as any).mutableClient.getAllStorage = jest.fn(() => Promise.resolve([storage]));

    const result = await toArray(provider.iterStorage((transactions as any).register.hash));

    expect(result).toEqual(expected);
  });

  test('iterBlocks - undefined iterBlocksFetchTimeoutMS', async () => {
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
          invocationData: { actions: '0' },
        }),

        createTransactionJSON('ClaimTransaction', {}),
      ],
    };

    // @ts-ignore
    provider.iterBlocks = jest.fn(() => AsyncIterableX.from([block]));

    const result = await toArray(provider.iterActionsRaw({ indexStart: 1, indexStop: 2 }));

    expect(result).toEqual(expected);
  });

  test('iterActions undefined filter', async () => {
    const expected = ['0'];
    const block = {
      transactions: [
        createTransactionJSON('InvocationTransaction', {
          invocationData: { actions: '0' },
        }),

        createTransactionJSON('ClaimTransaction', {}),
      ],
    };

    // @ts-ignore
    provider.iterBlocks = jest.fn(() => AsyncIterableX.from([block]));

    const result = await toArray(provider.iterActionsRaw());
    expect(result).toEqual(expected);
  });

  test('call', async () => {
    const contract = '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9';
    const method = 'testMethod';
    const params = ['param1'];

    // @ts-ignore
    (provider as any).mutableClient.testInvocation = jest.fn(() =>
      Promise.resolve(createInvocationResultJSON({ state: VMState.Fault, message: '10' })),
    );

    const result = await provider.call(contract, method, params);
    expect(result).toMatchSnapshot();
  });

  test('runConsensusNow', async () => {
    // @ts-ignore
    (provider as any).mutableClient.runConsensusNow = jest.fn();

    const result = await provider.runConsensusNow();

    expect(result).toBeUndefined();
    expect((provider as any).mutableClient.runConsensusNow).toHaveBeenCalledWith(undefined);
    expect((provider as any).mutableClient.runConsensusNow).toHaveBeenCalledTimes(1);
  });

  test('updateSettings', async () => {
    const options = { secondsPerBlock: 10 };
    // @ts-ignore
    (provider as any).mutableClient.updateSettings = jest.fn();
    const result = await provider.updateSettings(options);

    expect(result).toBeUndefined();
    expect((provider as any).mutableClient.updateSettings).toHaveBeenCalledWith(options, undefined);

    expect((provider as any).mutableClient.updateSettings).toHaveBeenCalledTimes(1);
  });

  test('fastForwardOffset', async () => {
    const offset = 10;
    // @ts-ignore
    (provider as any).mutableClient.fastForwardOffset = jest.fn();
    const result = await provider.fastForwardOffset(offset);

    expect(result).toBeUndefined();
    expect((provider as any).mutableClient.fastForwardOffset).toHaveBeenCalledWith(offset, undefined);

    expect((provider as any).mutableClient.fastForwardOffset).toHaveBeenCalledTimes(1);
  });

  test('fastForwardToTime', async () => {
    const time = 10;
    // @ts-ignore
    (provider as any).mutableClient.fastForwardToTime = jest.fn();
    const result = await provider.fastForwardToTime(time);

    expect(result).toBeUndefined();
    expect((provider as any).mutableClient.fastForwardToTime).toHaveBeenCalledWith(time, undefined);

    expect((provider as any).mutableClient.fastForwardToTime).toHaveBeenCalledTimes(1);
  });
});
