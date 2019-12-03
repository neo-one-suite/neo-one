import { ECPoint, Param, TransactionResult, UInt160, UInt256 } from '@neo-one/client-common';
import { AsyncIterableX, toArray } from '@reactivex/ix-es2015-cjs/asynciterable';
import { interval } from 'rxjs';
import { map, take } from 'rxjs/operators';
// tslint:disable-next-line no-implicit-dependencies
import { MessageChannel } from 'worker_threads';
import { data, factory, keys } from '../__data__';
import { Hash256 } from '../Hash256';
import { connectRemoteUserAccountProvider, RemoteUserAccountProvider } from '../user';

describe('RemoteUserAccountProvider', () => {
  const unlockedWallet = factory.createUnlockedWallet();
  const unlockedWallet1 = factory.createUnlockedWallet({
    userAccount: factory.createUserAccount({ id: factory.createUserAccountID({ address: keys[2].address }) }),
  });
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
  const transactionOptions = {
    from: unlockedWallet1.userAccount.id,
    attributes: [
      factory.createAddressAttribute(),
      factory.createBufferAttribute(),
      factory.createPublicKeyAttribute(),
      factory.createHash256Attribute(),
    ],
    networkFee: data.bigNumbers.a,
    systemFee: data.bigNumbers.b,
  };
  const sourceMap = {
    [keys[0].address]: {
      version: 1,
      sources: ['source1', 'source2'],
      names: ['name1', 'name2'],
      sourceRoot: 'root',
      sourcesContent: ['content1', 'content2'],
      mappings: 'mapping',
      file: 'file.ts',
    },
  };
  const blockCount = 1337;
  const block = factory.createBlock();
  const rawAction = factory.createRawLog();
  const selectUserAccount = jest.fn(async () => Promise.resolve(undefined));
  const deleteUserAccount = jest.fn(async () => Promise.resolve(undefined));
  const updateUserAccountName = jest.fn(async () => Promise.resolve(undefined));
  const commonRawCallReceipt = factory.createRawCallReceipt();
  const call = jest.fn(async () => commonRawCallReceipt);
  const iterBlocks = jest.fn(() => AsyncIterableX.from([block]));
  const getBlockCount = jest.fn(async () => blockCount);
  const getAccount = jest.fn(async () => unlockedWallet.userAccount);
  const iterActionsRaw = jest.fn(() => AsyncIterableX.from([rawAction]));
  let transfer: jest.Mock<Promise<TransactionResult>>;

  // tslint:disable-next-line no-any
  let provider: any;
  // tslint:disable-next-line no-any
  let port1: any;
  // tslint:disable-next-line no-any
  let port2: any;
  let cleanupSubscriptions: () => void;
  let remoteUserAccountProvider: RemoteUserAccountProvider;
  let commonTransactionResult = factory.createTransactionResult();
  beforeEach(() => {
    transfer = jest.fn(async () => factory.createTransactionResult());
    commonTransactionResult = factory.createTransactionResult();

    provider = {
      currentUserAccount$: interval(50).pipe(map(() => unlockedWallet.userAccount)),
      userAccounts$: interval(50).pipe(map(() => [unlockedWallet.userAccount])),
      networks$: interval(50).pipe(map(() => [unlockedWallet.userAccount.id.network])),
      getCurrentUserAccount: jest.fn(() => unlockedWallet.userAccount),
      getUserAccounts: jest.fn(() => [unlockedWallet.userAccount]),
      getNetworks: jest.fn(() => [unlockedWallet.userAccount.id.network]),
      selectUserAccount,
      deleteUserAccount,
      updateUserAccountName,
      transfer,
      claim: jest.fn(async () => commonTransactionResult),
      invoke: jest.fn(async () => commonTransactionResult),
      invokeSend: jest.fn(async () => commonTransactionResult),
      invokeRefundAssets: jest.fn(async () => commonTransactionResult),
      invokeCompleteSend: jest.fn(async () => commonTransactionResult),
      invokeClaim: jest.fn(async () => commonTransactionResult),
      call,
      iterBlocks,
      getBlockCount,
      getAccount,
      iterActionsRaw,
    };

    const messageChannel = new MessageChannel();
    port1 = messageChannel.port1;
    port2 = messageChannel.port2;
    // tslint:disable-next-line:no-object-mutation
    port1.addEventListener = (listener: (message: string) => void) => port1.on('message', listener);
    // tslint:disable-next-line:no-object-mutation
    port2.addEventListener = (listener: (message: string) => void) => port2.on('message', listener);

    remoteUserAccountProvider = new RemoteUserAccountProvider({
      endpoint: port1,
    });

    cleanupSubscriptions = connectRemoteUserAccountProvider({
      endpoint: port2,
      userAccountProvider: provider,
    });
  });

  afterEach(() => {
    cleanupSubscriptions();
    port1.close();
    port2.close();
  });

  test('currentUserAccount$', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const currentUserAccount = await remoteUserAccountProvider.currentUserAccount$.pipe(take(1)).toPromise();

    expect(currentUserAccount).toEqual(unlockedWallet.userAccount);
  });

  test('userAccounts$', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const userAccounts = await remoteUserAccountProvider.userAccounts$.pipe(take(1)).toPromise();

    expect(userAccounts).toEqual([unlockedWallet.userAccount]);
  });

  test('networks$', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const networks = await remoteUserAccountProvider.networks$.pipe(take(1)).toPromise();

    expect(networks).toEqual([unlockedWallet.userAccount.id.network]);
  });

  test('getCurrentUserAccount', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const currentUserAccount = remoteUserAccountProvider.getCurrentUserAccount();

    expect(currentUserAccount).toEqual(unlockedWallet.userAccount);
  });

  test('getUserAccounts', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const userAccounts = remoteUserAccountProvider.getUserAccounts();

    expect(userAccounts).toEqual([unlockedWallet.userAccount]);
  });

  test('getNetworks', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const networks = remoteUserAccountProvider.getNetworks();

    expect(networks).toEqual([unlockedWallet.userAccount.id.network]);
  });

  test('selectUserAccount', async () => {
    await remoteUserAccountProvider.selectUserAccount(unlockedWallet1.userAccount.id);

    expect(selectUserAccount.mock.calls).toMatchSnapshot();
  });

  test('deleteUserAccount', async () => {
    await remoteUserAccountProvider.deleteUserAccount(unlockedWallet.userAccount.id);

    expect(deleteUserAccount.mock.calls).toMatchSnapshot();
  });

  test('updateUserAccountName', async () => {
    await remoteUserAccountProvider.updateUserAccountName({ id: unlockedWallet.userAccount.id, name: 'newName' });

    expect(updateUserAccountName.mock.calls).toMatchSnapshot();
  });

  test('getBlockCount', async () => {
    const count = await remoteUserAccountProvider.getBlockCount(unlockedWallet.userAccount.id.network);

    expect(count).toEqual(blockCount);
  });

  test('getAccount', async () => {
    const account = await remoteUserAccountProvider.getAccount(
      unlockedWallet.userAccount.id.network,
      unlockedWallet.userAccount.id.address,
    );

    expect(account).toEqual(unlockedWallet.userAccount);
  });

  test('transfer', async () => {
    const transactionResult = factory.createTransactionResult();
    transfer.mockImplementation(async () => transactionResult);

    const result = await remoteUserAccountProvider.transfer(
      [{ amount: data.bigNumbers.a, asset: Hash256.NEO, to: keys[0].address }],
      {
        from: unlockedWallet1.userAccount.id,
      },
    );

    expect(transfer.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(transactionResult.transaction);

    const receipt = await result.confirmed();
    expect((transactionResult.confirmed as jest.Mock).mock.calls).toMatchSnapshot();

    const expectedReceipt = await transactionResult.confirmed();
    expect(receipt).toEqual(expectedReceipt);
  });

  test('claim', async () => {
    const result = await remoteUserAccountProvider.claim(transactionOptions);

    expect(provider.claim.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);

    const receipt = await result.confirmed({ timeoutMS: 1257 });
    expect((commonTransactionResult.confirmed as jest.Mock).mock.calls).toMatchSnapshot();

    const expectedReceipt = await commonTransactionResult.confirmed();
    expect(receipt).toEqual(expectedReceipt);
  });

  test('invoke', async () => {
    const result = await remoteUserAccountProvider.invoke(
      keys[0].address,
      'deploy',
      allScriptBuilderParams,
      allParamsZipped,
      true,
      {
        sendFrom: [{ amount: data.bigNumbers.a, asset: Hash256.NEO, to: keys[0].address }],
        sendTo: [{ amount: data.bigNumbers.a, asset: Hash256.NEO }],
      },
      sourceMap,
    );

    expect(provider.invoke.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);
    expect(provider.invoke.mock.calls[0][6]).toEqual(sourceMap);

    const receipt = await result.confirmed({ timeoutMS: 1257 });
    expect((commonTransactionResult.confirmed as jest.Mock).mock.calls).toMatchSnapshot();

    const expectedReceipt = await commonTransactionResult.confirmed();
    expect(receipt).toEqual(expectedReceipt);
  });

  test('invokeSend', async () => {
    const result = await remoteUserAccountProvider.invokeSend(
      keys[0].address,
      'deploy',
      allScriptBuilderParams,
      allParamsZipped,
      {
        amount: data.bigNumbers.a,
        asset: Hash256.NEO,
        to: keys[0].address,
      },
      transactionOptions,
      sourceMap,
    );

    expect(provider.invokeSend.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);
    expect(provider.invokeSend.mock.calls[0][6]).toEqual(sourceMap);

    const receipt = await result.confirmed({ timeoutMS: 1257 });
    expect((commonTransactionResult.confirmed as jest.Mock).mock.calls).toMatchSnapshot();

    const expectedReceipt = await commonTransactionResult.confirmed();
    expect(receipt).toEqual(expectedReceipt);
  });

  test('invokeCompleteSend', async () => {
    const result = await remoteUserAccountProvider.invokeCompleteSend(
      keys[0].address,
      'deploy',
      allScriptBuilderParams,
      allParamsZipped,
      Hash256.NEO,
      transactionOptions,
    );

    expect(provider.invokeCompleteSend.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);

    const receipt = await result.confirmed({ timeoutMS: 1257 });
    expect((commonTransactionResult.confirmed as jest.Mock).mock.calls).toMatchSnapshot();

    const expectedReceipt = await commonTransactionResult.confirmed();
    expect(receipt).toEqual(expectedReceipt);
  });

  test('invokeRefundAssets', async () => {
    const result = await remoteUserAccountProvider.invokeRefundAssets(
      keys[0].address,
      'deploy',
      allScriptBuilderParams,
      allParamsZipped,
      Hash256.NEO,
      transactionOptions,
      sourceMap,
    );

    expect(provider.invokeRefundAssets.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);
    expect(provider.invokeRefundAssets.mock.calls[0][6]).toEqual(sourceMap);

    const receipt = await result.confirmed({ timeoutMS: 1257 });
    expect((commonTransactionResult.confirmed as jest.Mock).mock.calls).toMatchSnapshot();

    const expectedReceipt = await commonTransactionResult.confirmed();
    expect(receipt).toEqual(expectedReceipt);
  });

  test('invokeClaim', async () => {
    const result = await remoteUserAccountProvider.invokeClaim(
      keys[0].address,
      'deploy',
      allScriptBuilderParams,
      allParamsZipped,
      transactionOptions,
    );

    expect(provider.invokeClaim.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);

    const receipt = await result.confirmed({ timeoutMS: 1257 });
    expect((commonTransactionResult.confirmed as jest.Mock).mock.calls).toMatchSnapshot();

    const expectedReceipt = await commonTransactionResult.confirmed();
    expect(receipt).toEqual(expectedReceipt);
  });

  test('call', async () => {
    const result = await remoteUserAccountProvider.call(
      unlockedWallet.userAccount.id.network,
      keys[0].address,
      'deploy',
      allScriptBuilderParams,
    );

    expect(call.mock.calls).toMatchSnapshot();
    expect(result).toEqual(commonRawCallReceipt);
  });

  test('iterBlocks', async () => {
    const blockIterator = remoteUserAccountProvider.iterBlocks(unlockedWallet.userAccount.id.network, {
      indexStart: 1,
      indexStop: 3,
    });

    const value = await toArray(blockIterator);
    expect(value).toEqual([block]);
  });

  test('iterActionsRaw', async () => {
    const actionIterator = remoteUserAccountProvider.iterActionsRaw(unlockedWallet.userAccount.id.network, {
      indexStart: 1,
      indexStop: 3,
    });

    const value = await toArray(actionIterator);
    expect(value).toEqual([rawAction]);
  });

  test('stress test', async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const blockIterator = remoteUserAccountProvider.iterBlocks(unlockedWallet.userAccount.id.network, {
      indexStart: 1,
      indexStop: 3,
    });
    const networks = remoteUserAccountProvider.getNetworks();
    const [currentAccount, invokeClaimResult, count, callResult, account, blockIteratorResult] = await Promise.all([
      remoteUserAccountProvider.currentUserAccount$.pipe(take(1)).toPromise(),
      remoteUserAccountProvider.invokeClaim(keys[0].address, 'deploy', [], []),
      remoteUserAccountProvider.getBlockCount(unlockedWallet.userAccount.id.network),
      remoteUserAccountProvider.call(unlockedWallet.userAccount.id.network, keys[0].address, 'deploy', []),
      remoteUserAccountProvider.getAccount(
        unlockedWallet.userAccount.id.network,
        unlockedWallet.userAccount.id.address,
      ),
      toArray(blockIterator),
    ]);

    expect(currentAccount).toEqual(unlockedWallet.userAccount);
    expect(invokeClaimResult.transaction).toEqual(commonTransactionResult.transaction);
    expect(provider.invokeClaim.mock.calls).toMatchSnapshot();
    expect(count).toEqual(blockCount);
    expect(callResult).toEqual(commonRawCallReceipt);
    expect(call.mock.calls).toMatchSnapshot();
    expect(account).toEqual(unlockedWallet.userAccount);
    expect(blockIteratorResult).toEqual([block]);
    expect(networks).toEqual([unlockedWallet.userAccount.id.network]);
  });
});
