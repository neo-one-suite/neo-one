// tslint:disable no-object-mutation
import { common, ECPoint, Param, UInt160, UInt256, utils } from '@neo-one/client-common';
import { Modifiable } from '@neo-one/utils';
import { from as asyncIterableFrom, toArray } from '@reactivex/ix-es2015-cjs/asynciterable';
import { of as _of } from 'rxjs';
import { Dapi, DapiUserAccountProvider, Provider } from '../../user';
import { data, factory, keys } from '../../__data__';

describe('DapiUserAccountProvider', () => {
  utils.randomUInt = () => 10;
  const unlockedWallet = factory.createUnlockedWallet();
  const getCurrentUserAccount = jest.fn(() => unlockedWallet.userAccount);

  const network = unlockedWallet.userAccount.id.network;
  const networks = [network];
  const getNetworks = jest.fn(() => networks);
  const getUnclaimed = jest.fn();
  const getOutput = jest.fn();
  const getTransaction = jest.fn();
  const getUnspentOutputs = jest.fn();
  const relayTransaction = jest.fn();
  const getTransactionReceipt = jest.fn();
  const getInvocationData = jest.fn();
  const testInvoke = jest.fn();
  const getBlockCount = jest.fn();
  const call = jest.fn();
  const iterBlocks = jest.fn();
  const getAccount = jest.fn();
  const iterActionsRaw = jest.fn();
  const dataProvider: Modifiable<Provider> = {
    networks$: _of(networks),
    getNetworks,
    getUnclaimed,
    getOutput,
    getTransaction,
    getUnspentOutputs,
    relayTransaction,
    getTransactionReceipt,
    getInvocationData,
    testInvoke,
    getBlockCount,
    getAccount,
    iterBlocks,
    iterActionsRaw,
    call,
  };

  const dapiNetworks = {
    networks,
    defaultNetwork: network,
  };
  const dapiAccount = {
    address: unlockedWallet.userAccount.id.address,
    label: 'Mock',
  };
  const dapiPublicKey = {
    address: unlockedWallet.userAccount.id.address,
    publicKey: unlockedWallet.userAccount.publicKey,
  };
  const writeResult = {
    txid: factory.createContractTransaction().hash,
    nodeUrl: 'http://mock.node.com:0000',
  };

  const dapi: Modifiable<Dapi> = {
    getNetworks: jest.fn(async () => dapiNetworks),
    getAccount: jest.fn(async () => dapiAccount),
    getPublicKey: jest.fn(async () => dapiPublicKey),
    send: jest.fn(async () => writeResult),
    invoke: jest.fn(async () => writeResult),
    addEventListener: jest.fn((name, cb) => {
      if (name === 'READY') {
        cb();
      }
    }),
    removeEventListener: jest.fn(),
  };

  let dapiProvider: DapiUserAccountProvider<typeof dataProvider>;
  beforeEach(() => {
    dapiProvider = new DapiUserAccountProvider({ provider: dataProvider, dapi });

    getCurrentUserAccount.mockImplementation(() => unlockedWallet.userAccount);
  });

  test('getCurrentUserAccount', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const result = dapiProvider.getCurrentUserAccount();

    expect(result).toEqual(unlockedWallet.userAccount);
  });

  test('getUserAccounts', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const result = dapiProvider.getUserAccounts();

    expect(result).toEqual([unlockedWallet.userAccount]);
  });

  test('getNetworks', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const result = dapiProvider.getNetworks();

    expect(result).toEqual(networks);
  });

  test('getBlockCount', async () => {
    const blockCount = 777;
    getBlockCount.mockImplementation(async () => blockCount);
    const result = await dapiProvider.getBlockCount(network);

    expect(result).toEqual(blockCount);
  });

  test('getAccount', async () => {
    const account = {
      address: unlockedWallet.userAccount.id.address,
      balances: {},
    };
    getAccount.mockImplementation(async () => account);
    const result = await dapiProvider.getAccount(unlockedWallet.userAccount.id.address, network);

    expect(result).toEqual(account);
  });

  test('iterBlocks', async () => {
    const block = factory.createBlock();

    iterBlocks.mockImplementation(() => asyncIterableFrom([block]));
    const blockIterator = dapiProvider.iterBlocks(unlockedWallet.userAccount.id.network, {
      indexStart: 1,
      indexStop: 3,
    });

    const value = await toArray(blockIterator);
    expect(value).toEqual([block]);
  });

  test('iterActionsRaw', async () => {
    const rawAction = factory.createRawLog();

    iterActionsRaw.mockImplementation(() => asyncIterableFrom([rawAction]));
    if (dapiProvider.iterActionsRaw === undefined) {
      throw new Error('iterActionsRaw should not be undefined.');
    }
    const actionIterator = dapiProvider.iterActionsRaw(unlockedWallet.userAccount.id.network, {
      indexStart: 1,
      indexStop: 3,
    });

    const value = await toArray(actionIterator);
    expect(value).toEqual([rawAction]);
  });

  test('selectUserAccount - not implemented', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    await expect(dapiProvider.selectUserAccount()).rejects.toMatchSnapshot();
  });

  test('transfer', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const transfer = factory.createTransfer();
    getUnspentOutputs.mockImplementation(async () => [factory.createInputOutput()]);
    getOutput.mockImplementation(async () => factory.createInputOutput());

    const transaction = factory.createContractTransaction();
    getTransaction.mockImplementation(async () => transaction);

    const receipt = factory.createTransactionReceipt();
    getTransactionReceipt.mockImplementation(async () => receipt);

    const result = await dapiProvider.transfer([transfer]);
    const confirmResult = await result.confirmed();

    expect(result.transaction).toEqual(transaction);
    expect(confirmResult).toEqual(receipt);

    expect(dapi.send).toMatchSnapshot();
  });

  test('transfer - nothing to transfer', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const result = dapiProvider.transfer([]);

    await expect(result).rejects.toMatchSnapshot();
  });

  test('claim - not implemented', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    await expect(dapiProvider.claim()).rejects.toMatchSnapshot();
  });

  test('call', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const receipt = factory.createRawCallReceipt();
    call.mockImplementation(async () => Promise.resolve(receipt));

    const result = await dapiProvider.call(network, keys[1].address, 'foo', [true]);

    expect(result).toEqual(receipt);

    expect(call.mock.calls).toMatchSnapshot();
  });

  describe('invoke methods', () => {
    const allScriptBuilderParams = [
      data.bns.a,
      data.numbers.a,
      Buffer.alloc(20, 7) as UInt160,
      Buffer.alloc(32, 8) as UInt256,
      Buffer.alloc(33, 9) as ECPoint,
      'stringData',
      Buffer.from('abc123', 'hex'),
      true,
      [data.bns.b, data.numbers.b],
      new Map([[data.bns.a, data.numbers.b] as const]),
      { key: false },
      undefined,
    ];
    const allParamsZipped = [
      ['undefined', undefined] as const,
      ['bignumber', data.bigNumbers.a] as const,
      ['buffer', data.buffers.a] as const,
      ['address', unlockedWallet.userAccount.id.address] as const,
      ['hash256', data.hash256s.a] as const,
      ['publicKey', keys[0].publicKeyString] as const,
      ['boolean', true] as const,
      [
        'array',
        [
          ['undefined', undefined],
          ['bignumber', data.bigNumbers.a],
        ],
      ] as const,
      ['map', new Map([[data.bns.a, data.numbers.b] as const])] as const,
      ['object', { key: false }] as const,
      [
        'forward',
        { name: 'forwardValue', converted: Buffer.alloc(20, 7), param: unlockedWallet.userAccount.id.address },
      ] as const,
    ] as ReadonlyArray<readonly [string, Param | undefined]>;

    const inputOutputs = [
      factory.createInputOutput(),
      factory.createInputOutput(),
      factory.createInputOutput({ asset: common.GAS_ASSET_HASH }),
      factory.createInputOutput({ asset: common.GAS_ASSET_HASH }),
    ];
    const invocation = factory.createInvocationTransaction();
    const receipt = factory.createRawCallReceipt();
    const invocationData = factory.createRawInvocationData();

    test('invoke', async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      getUnspentOutputs.mockImplementation(async () => inputOutputs);
      getOutput.mockImplementation(async () => factory.createInputOutput());
      getTransaction.mockImplementation(async () => invocation);
      getTransactionReceipt.mockImplementation(async () => receipt);
      testInvoke.mockImplementation(async () => receipt);
      getInvocationData.mockImplementation(async () => invocationData);

      const result = await dapiProvider.invoke(
        keys[0].address,
        'deploy',
        allScriptBuilderParams,
        allParamsZipped,
        true,
        {
          sendFrom: [{ amount: data.bigNumbers.a, asset: common.NEO_ASSET_HASH, to: keys[0].address }],
          sendTo: [{ amount: data.bigNumbers.a, asset: common.NEO_ASSET_HASH }],
          systemFee: data.bigNumbers.a,
        },
      );
      const confirmResult = await result.confirmed();

      expect(result.transaction).toEqual(invocation);
      expect(confirmResult).toEqual(receipt);

      expect(dapi.invoke).toMatchSnapshot();
    });

    test('invokeSend', async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      const transfer = factory.createTransfer();

      getUnspentOutputs.mockImplementation(async () => inputOutputs);
      getOutput.mockImplementation(async () => factory.createInputOutput());
      getTransaction.mockImplementation(async () => invocation);
      getTransactionReceipt.mockImplementation(async () => receipt);
      testInvoke.mockImplementation(async () => receipt);
      getInvocationData.mockImplementation(async () => invocationData);

      const result = await dapiProvider.invokeSend(
        keys[0].address,
        'deploy',
        allScriptBuilderParams,
        allParamsZipped,
        transfer,
        {
          from: unlockedWallet.userAccount.id,
          systemFee: data.bigNumbers.a,
        },
      );
      const confirmResult = await result.confirmed();

      expect(result.transaction).toEqual(invocation);
      expect(confirmResult).toEqual(receipt);

      expect(dapi.invoke).toMatchSnapshot();
    });

    test('invokeCompleteSend', async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      getUnspentOutputs.mockImplementation(async () => inputOutputs);
      getOutput.mockImplementation(async () => factory.createInputOutput());
      getTransaction.mockImplementation(async () => invocation);
      getTransactionReceipt.mockImplementation(async () => receipt);
      testInvoke.mockImplementation(async () => receipt);
      getInvocationData.mockImplementation(async () => invocationData);

      const result = await dapiProvider.invokeCompleteSend(
        keys[0].address,
        'deploy',
        allScriptBuilderParams,
        allParamsZipped,
        invocation.hash,
        {
          from: unlockedWallet.userAccount.id,
          systemFee: data.bigNumbers.a,
        },
      );
      const confirmResult = await result.confirmed();

      expect(result.transaction).toEqual(invocation);
      expect(confirmResult).toEqual(receipt);

      expect(dapi.invoke).toMatchSnapshot();
    });

    test('invokeRefundAssets', async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      getUnspentOutputs.mockImplementation(async () => inputOutputs);
      getOutput.mockImplementation(async () => factory.createInputOutput());
      getTransaction.mockImplementation(async () => invocation);
      getTransactionReceipt.mockImplementation(async () => receipt);
      testInvoke.mockImplementation(async () => receipt);
      getInvocationData.mockImplementation(async () => invocationData);

      const result = await dapiProvider.invokeRefundAssets(
        keys[0].address,
        'deploy',
        allScriptBuilderParams,
        allParamsZipped,
        invocation.hash,
        {
          from: unlockedWallet.userAccount.id,
          systemFee: data.bigNumbers.a,
        },
      );
      const confirmResult = await result.confirmed();

      expect(result.transaction).toEqual(invocation);
      expect(confirmResult).toEqual(receipt);

      expect(dapi.invoke).toMatchSnapshot();
    });

    test('invokeClaim - not implemented', async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      getOutput.mockImplementation(async () => factory.createInputOutput());
      getUnclaimed.mockImplementation(async () => ({
        unclaimed: [factory.createInputOutput({ asset: common.GAS_ASSET_HASH })],
        amount: data.bigNumbers.a,
      }));

      await expect(
        dapiProvider.invokeClaim(keys[0].address, 'deploy', allScriptBuilderParams, allParamsZipped),
      ).rejects.toMatchSnapshot();
    });
  });
});
