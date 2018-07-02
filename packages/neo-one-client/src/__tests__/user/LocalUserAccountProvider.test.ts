// tslint:disable
import { common, utils, Transaction } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import {
  InsufficientFundsError,
  InvalidTransactionError,
  InvokeError,
  NoAccountError,
  NothingToClaimError,
  NothingToIssueError,
  NothingToTransferError,
} from '../../errors';
import { AssetRegister, AttributeArg, ContractRegister, Transfer } from '../../types';
import { LocalUserAccountProvider } from '../../user/LocalUserAccountProvider';
import * as clientUtils from '../../utils';

describe('LocalUserAccountProvider', () => {
  const id1 = {
    network: 'net1',
    address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
  };

  const account1 = {
    type: 'test',
    id: id1,
    name: 'name1',
    scriptHash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
    publicKey: 'publicKey1',
  };

  const options = {
    from: id1,
    attributes: [{ usage: 'Remark', data: 'testData' }] as AttributeArg[],
    networkFee: new BigNumber('1'),
  };

  const outputs = {
    oneNEO: {
      asset: common.NEO_ASSET_HASH,
      value: new BigNumber('1'),
      address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      txid: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045a',
      vout: 1,
    },
    twoNEO: {
      asset: common.NEO_ASSET_HASH,
      value: new BigNumber('2'),
      address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      txid: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045a',
      vout: 2,
    },
    sevenNEO: {
      asset: common.NEO_ASSET_HASH,
      value: new BigNumber('7'),
      address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      txid: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045a',
      vout: 3,
    },
    oneGAS: {
      asset: common.GAS_ASSET_HASH,
      value: new BigNumber('1'),
      address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      txid: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045d',
      vout: 4,
    },
    twoGAS: {
      asset: common.GAS_ASSET_HASH,
      value: new BigNumber('2'),
      address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      txid: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045e',
      vout: 5,
    },
    elevenGAS: {
      asset: common.GAS_ASSET_HASH,
      value: new BigNumber('11'),
      address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      txid: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045e',
      vout: 6,
    },
    oneTKY: {
      asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
      value: new BigNumber('1'),
      address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      txid: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
      vout: 7,
    },
    twoTKY: {
      asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
      value: new BigNumber('2'),
      address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      txid: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
      vout: 8,
    },
    threeTKY: {
      asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
      value: new BigNumber('3'),
      address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      txid: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
      vout: 9,
    },
  };

  const results = {
    fault: {
      state: 'FAULT',
      gasConsumed: new BigNumber('3'),
      stack: [{ type: 'String', value: 'val' }],
      message: 'testMessage',
    },

    halt: {
      state: 'HALT',
      gasConsumed: utils.ZERO_BIG_NUMBER,
      stack: [{ type: 'String', value: 'val' }],
    },
  };

  const witness = {
    invocation: '02028a99826ed',
    verification: '02028a99826ee',
  };

  let keystore: any = {};
  let provider: any = {};
  let localUserAccountProvider = new LocalUserAccountProvider({
    keystore,
    provider,
  } as any);

  const verifyMock = (name: string, mock: any) => {
    Object.entries(mock).forEach(([key, maybeMock]: [string, any]) => {
      if (maybeMock != undefined && maybeMock.mock != undefined && maybeMock.mock.calls != undefined) {
        expect(maybeMock.mock.calls).toMatchSnapshot(`${name}.${key}`);
      }
    });
  };
  const verifyMocks = () => {
    verifyMock('keystore', keystore);
    verifyMock('provider', provider);
  };

  beforeEach(() => {
    keystore = {};
    provider = {};
    provider.getBlockCount = jest.fn(() => Promise.resolve(0));
    provider.relayTransaction = jest.fn(() => Promise.resolve('transactionDummy'));
    localUserAccountProvider = new LocalUserAccountProvider({
      keystore,
      provider,
    } as any);

    utils.randomUInt = () => 10;
  });

  test('getCurrentAccount', () => {
    keystore.getCurrentAccount = jest.fn(() => account1);

    const result = localUserAccountProvider.getCurrentAccount();
    expect(result).toEqual(account1);
    verifyMocks();
  });

  test('getAccounts', () => {
    const expected = [account1];
    keystore.getAccounts = jest.fn(() => expected);
    const result = localUserAccountProvider.getAccounts();
    expect(result).toEqual(expected);
    verifyMocks();
  });

  test('getNetworks', () => {
    const expected = ['main', 'test', 'net1'];
    provider.getNetworks = jest.fn(() => expected);
    const result = localUserAccountProvider.getNetworks();
    expect(result).toEqual(expected);
    verifyMocks();
  });

  test('selectAccount', async () => {
    keystore.selectAccount = jest.fn(() => Promise.resolve());
    await localUserAccountProvider.selectAccount(id1);
    verifyMocks();
  });

  test('deleteAccount', async () => {
    keystore.deleteAccount = jest.fn(() => Promise.resolve());
    await localUserAccountProvider.deleteAccount(id1);
    verifyMocks();
  });

  test('updateAccountName', async () => {
    keystore.updateAccountName = jest.fn(() => Promise.resolve());
    await localUserAccountProvider.updateAccountName({
      id: id1,
      name: 'newName',
    });

    verifyMocks();
  });

  test('read', async () => {
    const expected = '10';
    provider.read = jest.fn(() => expected);
    const result = localUserAccountProvider.read('main');
    expect(result).toEqual(expected);
    verifyMocks();
  });

  test('transfer throws error on empty transfers', async () => {
    const transfers: Transfer[] = [];
    keystore.getCurrentAccount = jest.fn(() => account1);
    const result = localUserAccountProvider.transfer(transfers);
    await expect(result).rejects.toEqual(new NothingToTransferError());
    verifyMocks();
  });

  test('transfer throws error on missing account', async () => {
    const transfers: Transfer[] = [];
    keystore.getCurrentAccount = jest.fn();
    const result = localUserAccountProvider.transfer(transfers);
    await expect(result).rejects.toEqual(new NoAccountError());
    verifyMocks();
  });

  test('transfer throws insufficient funds error', async () => {
    const transfers = [
      {
        amount: new BigNumber('10'),
        asset: 'testAsset',
        to: 'testAddr',
      },
    ];

    const unspent = {
      asset: 'testAsset',
      value: new BigNumber('5'),
      address: 'addr1',
      txid: 'unspentTxid',
      vout: 1,
    };

    provider.getUnspentOutputs = jest.fn(() => Promise.resolve([unspent]));

    const result = localUserAccountProvider.transfer(transfers, options);
    await expect(result).rejects.toEqual(new InsufficientFundsError(new BigNumber('5'), new BigNumber('10')));

    verifyMocks();
  });

  test('transfer 0', async () => {
    const transfers = [
      {
        amount: utils.ZERO_BIG_NUMBER,
        asset: common.NEO_ASSET_HASH,
        to: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
      },
    ];

    const unspent = [outputs.oneNEO, outputs.elevenGAS];
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    keystore.sign = jest.fn(() => witness);
    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));
    const result = await localUserAccountProvider.transfer(transfers, options);
    expect(result.transaction).toEqual('transactionDummy');
    await expect(result.confirmed()).resolves.toEqual('receiptDummy');
    verifyMocks();
  });

  const testTransfer = (noGas: boolean) => {
    test(`transfer${noGas ? ' without network fee' : ''}`, async () => {
      const transfers = [
        {
          amount: new BigNumber('5'),
          asset: common.NEO_ASSET_HASH,
          to: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
        },
      ];

      const unspent = [
        outputs.oneNEO,
        outputs.oneNEO,
        outputs.oneNEO,
        outputs.oneNEO,
        outputs.oneNEO,
        outputs.oneNEO,
        outputs.elevenGAS,
      ];

      provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
      keystore.sign = jest.fn(() => witness);

      provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

      const result = await localUserAccountProvider.transfer(transfers, {
        from: options.from,
        attributes: options.attributes,
        networkFee: noGas ? undefined : options.networkFee,
      });

      expect(result.transaction).toEqual('transactionDummy');
      await expect(result.confirmed()).resolves.toEqual('receiptDummy');
      verifyMocks();
    });
  };

  testTransfer(true);
  testTransfer(false);

  test('claim throws NothingToClaim error', async () => {
    const unspent = [outputs.elevenGAS];
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getUnclaimed = jest.fn(() =>
      Promise.resolve({
        unclaimed: [],
        amount: new BigNumber('0'),
      }),
    );

    const result = localUserAccountProvider.claim(options);
    await expect(result).rejects.toEqual(new NothingToClaimError());
    verifyMocks();
  });

  const testClaim = (noGas: boolean) => {
    test(`claim${noGas ? ' without networkFee' : ''}`, async () => {
      const unspent = [outputs.elevenGAS];

      keystore.sign = jest.fn(() => witness);
      provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
      provider.getUnclaimed = jest.fn(() =>
        Promise.resolve({
          unclaimed: [
            {
              txid: '0x7f48028c36117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
              vout: 2,
            },
          ],

          amount: new BigNumber('3'),
        }),
      );

      provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

      const result = await localUserAccountProvider.claim({
        from: options.from,
        attributes: options.attributes,
        networkFee: noGas ? undefined : options.networkFee,
      });

      expect(result.transaction).toEqual('transactionDummy');
      await expect(result.confirmed()).resolves.toEqual('receiptDummy');
      verifyMocks();
    });
  };

  testClaim(true);
  testClaim(false);

  test('error thrown on 2 script attributes when neither match script hash', async () => {
    const unspent = [outputs.elevenGAS];
    const errorOptions = {
      from: id1,
      attributes: [
        { usage: 'Script', data: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9' },
        { usage: 'Script', data: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9' },
      ],

      networkFee: new BigNumber('1'),
    };

    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getUnclaimed = jest.fn(() =>
      Promise.resolve({
        unclaimed: [
          {
            txid: '0x7f48028c36117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
            vout: 2,
          },
        ],

        amount: new BigNumber('3'),
      }),
    );

    // Force flow to accept script attributes to test error handling
    const result = localUserAccountProvider.claim(errorOptions as any);
    await expect(result).rejects.toEqual(new InvalidTransactionError('Something went wrong!'));

    verifyMocks();
  });

  test('error thrown with 2 script attributes and no transaction scripts', async () => {
    const unspent = [outputs.elevenGAS];
    const errorOptions = {
      from: id1,
      attributes: [
        { usage: 'Script', data: '0xcef0c0fdcfe7838eff6ff104f9cdec2922297537' },
        { usage: 'Script', data: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9' },
      ],

      networkFee: new BigNumber('1'),
    };

    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getUnclaimed = jest.fn(() =>
      Promise.resolve({
        unclaimed: [
          {
            txid: '0x7f48028c36117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
            vout: 2,
          },
        ],

        amount: new BigNumber('3'),
      }),
    );

    // Force flow to accept script attributes to test error handling
    const result = localUserAccountProvider.claim(errorOptions as any);
    await expect(result).rejects.toEqual(new InvalidTransactionError('Something went wrong!'));

    verifyMocks();
  });

  test('error thrown with 1 script attributes and no transaction scripts', async () => {
    const unspent = [outputs.elevenGAS];
    const errorOptions = {
      from: id1,
      attributes: [{ usage: 'Script', data: '0xcef0c0fddfe7838eff6ff104f9cdec2922297537' }],

      networkFee: new BigNumber('1'),
    };

    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getUnclaimed = jest.fn(() =>
      Promise.resolve({
        unclaimed: [
          {
            txid: '0x7f48028c36117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
            vout: 2,
          },
        ],

        amount: new BigNumber('3'),
      }),
    );

    // Force flow to accept script attributes to test error handling
    const result = localUserAccountProvider.claim(errorOptions as any);
    await expect(result).rejects.toEqual(new InvalidTransactionError('Something went wrong!'));

    verifyMocks();
  });

  test('error thrown with 3+ script attributes', async () => {
    const unspent = [outputs.elevenGAS];
    const errorOptions = {
      from: id1,
      attributes: [
        { usage: 'Script', data: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9' },
        { usage: 'Script', data: '0xcef0c0fdcfe7838eff6ff104f9cdec2922297537' },
        { usage: 'Script', data: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9' },
      ],

      networkFee: new BigNumber('1'),
    };

    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getUnclaimed = jest.fn(() =>
      Promise.resolve({
        unclaimed: [
          {
            txid: '0x7f48028c36117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
            vout: 2,
          },
        ],

        amount: new BigNumber('3'),
      }),
    );

    // Force flow to accept script attributes to test error handling
    const result = localUserAccountProvider.claim(errorOptions as any);
    await expect(result).rejects.toEqual(new InvalidTransactionError('Something went wrong!'));

    verifyMocks();
  });

  test('error thrown with with 0 script attributes, but nonzero transaction scripts', async () => {
    const contract = '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9';
    const method = 'testMethod';
    const params: any[] = [];
    const paramsZipped: any[] = [];
    const verify = true;
    const unspent = [outputs.elevenGAS];
    const errorOptions = {
      from: id1,
      attributes: [],
      networkFee: new BigNumber('1'),
    };

    // Force no transaction attributes to hit error
    (localUserAccountProvider as any).convertAttributes = jest.fn(() => []);
    keystore.getCurrentAccount = jest.fn(() => account1);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    keystore.sign = jest.fn(() => witness);
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));

    const result = localUserAccountProvider.invoke(contract, method, params, paramsZipped, verify, errorOptions);

    await expect(result).rejects.toEqual(new InvalidTransactionError('Something went wrong!'));

    verifyMocks();
  });

  test('publish throws error on invoke fault', async () => {
    const contract: ContractRegister = {
      script: '02028a99826ef',
      parameters: ['String'],
      returnType: 'String',
      name: 'nameTest',
      codeVersion: 'v1',
      author: 'testAuthor',
      email: 'testEmail',
      description: 'testDescription',
      properties: {
        storage: true,
        dynamicInvoke: true,
        payable: true,
      },
    };

    const unspent = [outputs.elevenGAS];
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.fault));

    const result = localUserAccountProvider.publish(contract, options);
    await expect(result).rejects.toEqual(new InvokeError('testMessage'));
    verifyMocks();
  });

  test('publish throws error when no contracts are created', async () => {
    const contract: ContractRegister = {
      script: '02028a99826ef',
      parameters: ['String'],
      returnType: 'String',
      name: 'nameTest',
      codeVersion: 'v1',
      author: 'testAuthor',
      email: 'testEmail',
      description: 'testDescription',
      properties: {
        storage: false,
        dynamicInvoke: true,
        payable: true,
      },
    };

    const unspent = [outputs.elevenGAS];
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));
    provider.getInvocationData = jest.fn(() =>
      Promise.resolve({
        result: results.halt,
        contracts: [],
      }),
    );

    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    const result = await localUserAccountProvider.publish(contract, options);
    await expect(result.confirmed()).rejects.toEqual(
      new InvalidTransactionError(
        'Something went wrong! Expected a contract' + ' to have been created, but none was found',
      ),
    );

    verifyMocks();
  });

  test('publish - result fault', async () => {
    const contract: ContractRegister = {
      script: '02028a99826ef',
      parameters: ['String'],
      returnType: 'String',
      name: 'nameTest',
      codeVersion: 'v1',
      author: 'testAuthor',
      email: 'testEmail',
      description: 'testDescription',
      properties: {
        storage: false,
        dynamicInvoke: false,
        payable: true,
      },
    };

    const unspent = [outputs.elevenGAS];
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));
    provider.getInvocationData = jest.fn(() =>
      Promise.resolve({
        result: results.fault,
        contracts: [],
      }),
    );

    provider.getTransactionReceipt = jest.fn(() =>
      Promise.resolve({
        blockIndex: 0,
        blockHash: 'blkHash1',
        transactionIndex: 1,
      }),
    );

    const result = await localUserAccountProvider.publish(contract, options);
    await expect(result.confirmed()).resolves.toEqual({
      blockIndex: 0,
      blockHash: 'blkHash1',
      transactionIndex: 1,
      result: {
        state: results.fault.state,
        gasConsumed: results.fault.gasConsumed,
        message: results.fault.message,
      },
    });

    verifyMocks();
  });

  test('publish - result success', async () => {
    const contract: ContractRegister = {
      script: '02028a99826ef',
      parameters: ['String'],
      returnType: 'String',
      name: 'nameTest',
      codeVersion: 'v1',
      author: 'testAuthor',
      email: 'testEmail',
      description: 'testDescription',
      properties: {
        storage: true,
        dynamicInvoke: false,
        payable: true,
      },
    };

    const unspent = [outputs.elevenGAS];
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));
    provider.getInvocationData = jest.fn(() =>
      Promise.resolve({
        result: results.halt,
        contracts: [contract],
      }),
    );

    provider.getTransactionReceipt = jest.fn(() =>
      Promise.resolve({
        blockIndex: 0,
        blockHash: 'blkHash1',
        transactionIndex: 1,
      }),
    );

    const result = await localUserAccountProvider.publish(contract, options);
    await expect(result.confirmed()).resolves.toEqual({
      blockIndex: 0,
      blockHash: 'blkHash1',
      transactionIndex: 1,
      result: {
        state: results.halt.state,
        gasConsumed: results.halt.gasConsumed,
        value: contract,
      },
    });

    verifyMocks();
  });

  test('registerAsset throws error on missing asset', async () => {
    const asset: AssetRegister = {
      assetType: 'Currency',
      name: 'testAsset',
      amount: new BigNumber('5'),
      precision: 0,
      owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
      admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
      issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
    };

    const unspent = [outputs.elevenGAS];
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));
    provider.getInvocationData = jest.fn(() =>
      Promise.resolve({
        result: results.halt,
        asset: undefined,
      }),
    );

    provider.getTransactionReceipt = jest.fn(() =>
      Promise.resolve({
        blockIndex: 0,
        blockHash: 'blkHash1',
        transactionIndex: 1,
      }),
    );

    const result = await localUserAccountProvider.registerAsset(asset, options);
    await expect(result.confirmed()).rejects.toEqual(
      new InvalidTransactionError(
        'Something went wrong! Expected a asset to have been created, ' + 'but none was found',
      ),
    );

    verifyMocks();
  });

  test('registerAsset with no options', async () => {
    const asset: AssetRegister = {
      assetType: 'Currency',
      name: 'testAsset',
      amount: new BigNumber('5'),
      precision: 0,
      owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
      admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
      issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
    };

    const unspent = [outputs.elevenGAS];
    keystore.getCurrentAccount = jest.fn(() => account1);
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));
    provider.getInvocationData = jest.fn(() =>
      Promise.resolve({
        result: results.fault,
        asset,
      }),
    );

    provider.getTransactionReceipt = jest.fn(() =>
      Promise.resolve({
        blockIndex: 0,
        blockHash: 'blkHash1',
        transactionIndex: 1,
      }),
    );

    const result = await localUserAccountProvider.registerAsset(asset);
    await expect(result.confirmed({ timeoutMS: 10 })).resolves.toEqual({
      blockIndex: 0,
      blockHash: 'blkHash1',
      transactionIndex: 1,
      result: {
        state: results.fault.state,
        gasConsumed: results.fault.gasConsumed,
        message: results.fault.message,
      },
    });

    verifyMocks();
  });

  test('registerAsset - result fault', async () => {
    const asset: AssetRegister = {
      assetType: 'Currency',
      name: 'testAsset',
      amount: new BigNumber('5'),
      precision: 0,
      owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
      admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
      issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
    };

    const unspent = [outputs.elevenGAS];
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));
    provider.getInvocationData = jest.fn(() =>
      Promise.resolve({
        result: results.fault,
        asset,
      }),
    );

    provider.getTransactionReceipt = jest.fn(() =>
      Promise.resolve({
        blockIndex: 0,
        blockHash: 'blkHash1',
        transactionIndex: 1,
      }),
    );

    const result = await localUserAccountProvider.registerAsset(asset, options);
    await expect(result.confirmed()).resolves.toEqual({
      blockIndex: 0,
      blockHash: 'blkHash1',
      transactionIndex: 1,
      result: {
        state: results.fault.state,
        gasConsumed: results.fault.gasConsumed,
        message: results.fault.message,
      },
    });

    verifyMocks();
  });

  test('registerAsset - result success', async () => {
    const asset: AssetRegister = {
      assetType: 'Currency',
      name: 'testAsset',
      amount: new BigNumber('5'),
      precision: 0,
      owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
      admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
      issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
    };

    const unspent = [outputs.elevenGAS];
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));
    provider.getInvocationData = jest.fn(() =>
      Promise.resolve({
        result: results.halt,
        asset,
      }),
    );

    provider.getTransactionReceipt = jest.fn(() =>
      Promise.resolve({
        blockIndex: 0,
        blockHash: 'blkHash1',
        transactionIndex: 1,
      }),
    );

    const result = await localUserAccountProvider.registerAsset(asset, options);
    await expect(result.confirmed()).resolves.toEqual({
      blockIndex: 0,
      blockHash: 'blkHash1',
      transactionIndex: 1,
      result: {
        state: results.halt.state,
        gasConsumed: results.halt.gasConsumed,
        value: asset,
      },
    });

    verifyMocks();
  });

  test('issue throws error on no inputs', async () => {
    const transfers: any[] = [];
    keystore.getCurrentAccount = jest.fn(() => account1);
    provider.getNetworkSettings = jest.fn(() =>
      Promise.resolve({
        issueGASFee: utils.ZERO_BIG_NUMBER,
      }),
    );

    const result = localUserAccountProvider.issue(transfers);
    await expect(result).rejects.toEqual(new NothingToIssueError());
    verifyMocks();
  });

  test('issue', async () => {
    const transfers = [
      {
        amount: new BigNumber('5'),
        asset: common.NEO_ASSET_HASH,
        to: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
      },
    ];

    const unspent = [outputs.sevenNEO, outputs.elevenGAS];
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    keystore.sign = jest.fn(() => witness);
    provider.getNetworkSettings = jest.fn(() =>
      Promise.resolve({
        issueGASFee: new BigNumber('2'),
      }),
    );

    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    const result = await localUserAccountProvider.issue(transfers, options);

    expect(result.transaction).toEqual('transactionDummy');
    await expect(result.confirmed()).resolves.toEqual('receiptDummy');
    verifyMocks();
  });

  test('invoke with no options', async () => {
    const contract = '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9';
    const method = 'testMethod';
    const params: any[] = [];
    const paramsZipped: any[] = [];
    const verify = false;
    const unspent = [outputs.sevenNEO, outputs.elevenGAS];
    keystore.getCurrentAccount = jest.fn(() => account1);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    keystore.sign = jest.fn(() => witness);
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));

    provider.getTransactionReceipt = jest.fn(() =>
      Promise.resolve({
        blockIndex: 0,
        blockHash: 'blkHash1',
        transactionIndex: 1,
      }),
    );

    provider.getInvocationData = jest.fn(() =>
      Promise.resolve({
        result: results.halt,
        actions: ['action1'],
      }),
    );

    const result = await localUserAccountProvider.invoke(contract, method, params, paramsZipped, verify);

    await expect(result.confirmed()).resolves.toEqual({
      blockIndex: 0,
      blockHash: 'blkHash1',
      transactionIndex: 1,
      result: results.halt,
      actions: ['action1'],
    });

    verifyMocks();
  });

  test('invoke', async () => {
    const contract = '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9';
    const method = 'testMethod';
    const testBN = clientUtils.bigNumberToBN(new BigNumber('1'), 1);
    const params = ['param1', [undefined], testBN];
    const paramsZipped: any[] = [['String', 'param1'], ['Array', [undefined]], ['BigNumber', new BigNumber('1')]];

    const verify = true;
    const unspent = [outputs.sevenNEO, outputs.elevenGAS];
    keystore.getCurrentAccount = jest.fn(() => account1);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    keystore.sign = jest.fn(() => witness);
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));

    provider.getTransactionReceipt = jest.fn(() =>
      Promise.resolve({
        blockIndex: 0,
        blockHash: 'blkHash1',
        transactionIndex: 1,
      }),
    );

    provider.getInvocationData = jest.fn(() =>
      Promise.resolve({
        result: results.halt,
        actions: ['action1'],
      }),
    );

    const result = await localUserAccountProvider.invoke(contract, method, params, paramsZipped, verify);

    await expect(result.confirmed()).resolves.toEqual({
      blockIndex: 0,
      blockHash: 'blkHash1',
      transactionIndex: 1,
      result: results.halt,
      actions: ['action1'],
    });

    verifyMocks();
  });

  test('call with no options', async () => {
    const contract = '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9';
    const method = 'testMethod';
    const params: any[] = [];
    const unspent = [outputs.sevenNEO, outputs.elevenGAS];
    keystore.getCurrentAccount = jest.fn(() => account1);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));

    const result = await localUserAccountProvider.call(contract, method, params);

    expect(result).toEqual(results.halt);
    verifyMocks();
  });

  test('call', async () => {
    const contract = '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9';
    const method = 'testMethod';
    const params = ['param1'];
    const unspent = [outputs.sevenNEO, outputs.elevenGAS];
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.testInvoke = jest.fn(() => Promise.resolve(results.halt));

    const result = await localUserAccountProvider.call(contract, method, params, options);

    expect(result).toEqual(results.halt);
    verifyMocks();
  });

  test(`multi-input-fix networkFee-throws`, async () => {
    const transfers1 = [
      {
        amount: new BigNumber('6'),
        asset: common.NEO_ASSET_HASH,
        to: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
      },
    ];
    const transfers2 = [
      {
        amount: new BigNumber('1'),
        asset: common.NEO_ASSET_HASH,
        to: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
      },
    ];

    const unspent1 = [outputs.sevenNEO, outputs.oneNEO, outputs.elevenGAS];

    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent1));
    keystore.sign = jest.fn(() => witness);

    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    const result1 = await localUserAccountProvider.transfer(transfers1, {
      from: options.from,
      attributes: options.attributes,
      networkFee: new BigNumber('1'),
    });

    const result2 = localUserAccountProvider.transfer(transfers2, {
      from: options.from,
      attributes: options.attributes,
      networkFee: new BigNumber('1'),
    });
    await result1;
    // @ts-ignore
    expect(localUserAccountProvider.mutableUsedOutputs.size).toEqual(2);
    await expect(result2).rejects.toThrow();
    verifyMocks();
  });

  test('multi-input-fix updates-on-new-block', async () => {
    const transfers1 = [
      {
        amount: new BigNumber('1'),
        asset: common.NEO_ASSET_HASH,
        to: id1.address,
      },
    ];
    const transfers2 = [
      {
        amount: new BigNumber('1'),
        asset: common.NEO_ASSET_HASH,
        to: id1.address,
      },
    ];
    const unspent = [outputs.oneNEO];

    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    keystore.sign = jest.fn(() => witness);
    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    const result1 = await localUserAccountProvider.transfer(transfers1, {
      from: options.from,
      attributes: options.attributes,
    });

    provider.getBlockCount = jest.fn(() => Promise.resolve(1));

    const result2 = await localUserAccountProvider.transfer(transfers2, {
      from: options.from,
      attributes: options.attributes,
    });

    await result1;
    // @ts-ignore
    expect(localUserAccountProvider.mutableUsedOutputs.size).toEqual(1);
    expect(result2).toHaveProperty('transaction');
    verifyMocks();
  });

  test('transaction consolidates', async () => {
    const unspent = [outputs.oneNEO, outputs.twoNEO, outputs.sevenNEO, outputs.oneGAS, outputs.elevenGAS];
    const transfer = [
      {
        amount: new BigNumber('3'),
        asset: common.NEO_ASSET_HASH,
        to: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
      },
    ];
    keystore.byteLimit = 800;
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    const spy = jest.spyOn(localUserAccountProvider, 'addWitness' as any);
    await localUserAccountProvider.transfer(transfer, {
      from: options.from,
      attributes: options.attributes,
    });
    const consolidatedTransaction = spy.mock.calls[0][0].transaction;
    expect(consolidatedTransaction.serializeUnsigned().length).toEqual(366);
    expect(consolidatedTransaction.inputs.length).toEqual(5);
    expect(consolidatedTransaction.outputs.length).toEqual(3);

    spy.mockReset();
    spy.mockRestore();
    verifyMocks();
  });

  test(`claim consolidates`, async () => {
    const unspent = [outputs.elevenGAS];

    keystore.byteLimit = 500;
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getUnclaimed = jest.fn(() =>
      Promise.resolve({
        unclaimed: [
          {
            txid: '0x7f48028c36117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
            vout: 2,
          },
        ],

        amount: new BigNumber('3'),
      }),
    );
    const spy = jest.spyOn(localUserAccountProvider, 'addWitness' as any);

    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    await localUserAccountProvider.claim({
      from: options.from,
      attributes: options.attributes,
    });

    const consolidatedTransaction = spy.mock.calls[0][0].transaction;
    expect(consolidatedTransaction.serializeUnsigned().length).toEqual(145);
    expect(consolidatedTransaction.inputs.length).toEqual(1);
    expect(consolidatedTransaction.outputs.length).toEqual(1);

    spy.mockReset();
    spy.mockRestore();
    verifyMocks();
  });

  test(`blank transaction consolidates`, async () => {
    const unspent = [
      outputs.oneNEO,
      outputs.twoNEO,
      outputs.sevenNEO,
      outputs.oneGAS,
      outputs.twoGAS,
      outputs.elevenGAS,
    ];
    keystore.byteLimit = 800;
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    const spy = jest.spyOn(localUserAccountProvider, 'addWitness' as any);
    await localUserAccountProvider.transfer([], {
      from: options.from,
      attributes: options.attributes,
    });
    const consolidatedTransaction = spy.mock.calls[0][0].transaction;
    expect(consolidatedTransaction.serializeUnsigned().length).toEqual(340);
    expect(consolidatedTransaction.inputs.length).toEqual(6);
    expect(consolidatedTransaction.outputs.length).toEqual(2);

    spy.mockReset();
    spy.mockRestore();
    verifyMocks();
  });

  test(`consolidate prioritizes any asset with a return output`, async () => {
    const unspent = [
      outputs.oneTKY,
      outputs.threeTKY,
      outputs.oneNEO,
      outputs.twoNEO,
      outputs.sevenNEO,
      outputs.oneGAS,
      outputs.twoGAS,
      outputs.elevenGAS,
    ];

    const transfers = [
      {
        amount: new BigNumber('2'),
        asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
        to: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
      },
    ];

    keystore.byteLimit = 250;
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    const spy = jest.spyOn(localUserAccountProvider, 'addWitness' as any);
    await localUserAccountProvider.transfer(transfers, {
      from: options.from,
      attributes: options.attributes,
    });
    const consolidatedTransaction = spy.mock.calls[0][0].transaction as Transaction;
    expect(consolidatedTransaction.serializeUnsigned().length).toEqual(204);
    expect(
      consolidatedTransaction.inputs.every((input) => common.uInt256ToString(input.hash) === outputs.oneTKY.asset),
    ).toBe(true);

    spy.mockReset();
    spy.mockRestore();
    verifyMocks();
  });

  test(`consolidation prioritizes NEO/GAS for new outputs`, async () => {
    const unspent = [
      outputs.oneTKY,
      outputs.twoTKY,
      outputs.oneNEO,
      outputs.twoNEO,
      outputs.sevenNEO,
      outputs.oneGAS,
      outputs.twoGAS,
      outputs.elevenGAS,
    ];

    keystore.byteLimit = 400;
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    const spy = jest.spyOn(localUserAccountProvider, 'addWitness' as any);
    await localUserAccountProvider.transfer([], {
      from: options.from,
      attributes: options.attributes,
    });
    const consolidatedTransaction = spy.mock.calls[0][0].transaction as Transaction;
    expect(consolidatedTransaction.inputs.some((input) => input.index === 7 || input.index === 8)).toBe(false);

    spy.mockReset();
    spy.mockRestore();
    verifyMocks();
  });

  test('transaction consolidates GAS when network fee present', async () => {
    const unspent = [outputs.oneNEO, outputs.oneGAS, outputs.elevenGAS];
    const transfer = [
      {
        amount: new BigNumber('1'),
        asset: common.NEO_ASSET_HASH,
        to: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
      },
    ];
    keystore.byteLimit = 800;
    keystore.sign = jest.fn(() => witness);
    provider.getUnspentOutputs = jest.fn(() => Promise.resolve(unspent));
    provider.getTransactionReceipt = jest.fn(() => Promise.resolve('receiptDummy'));

    const spy = jest.spyOn(localUserAccountProvider, 'addWitness' as any);
    await localUserAccountProvider.transfer(transfer, {
      from: options.from,
      attributes: options.attributes,
      networkFee: new BigNumber('2'),
    });
    const consolidatedTransaction = spy.mock.calls[0][0].transaction;
    expect(consolidatedTransaction.inputs.length).toEqual(3);
    expect(consolidatedTransaction.outputs.length).toEqual(2);

    spy.mockReset();
    spy.mockRestore();
    verifyMocks();
  });
});
