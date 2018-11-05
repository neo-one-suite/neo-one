import { TransactionResult } from '@neo-one/client-common';
import { Hash256 } from '@neo-one/client-core';
import { of as _of } from 'rxjs';
import { take } from 'rxjs/operators';
import { data, factory, keys } from '../__data__';
import { Client } from '../Client';
import { UserAccountProvider } from '../types';

describe('Client', () => {
  const type = 'memory';
  const type1 = 'local';
  const unlockedWallet = factory.createUnlockedWallet();
  const unlockedWallet1 = factory.createUnlockedWallet({
    account: factory.createUserAccount({ id: factory.createUserAccountID({ address: keys[2].address }) }),
  });
  const lockedWallet = factory.createLockedWallet();
  const selectUserAccount = jest.fn();
  const deleteUserAccount = jest.fn();
  const updateUserAccountName = jest.fn();
  const commonTransactionResult = factory.createTransactionResult();
  const claim = jest.fn(async () => commonTransactionResult);
  const publish = jest.fn(async () => commonTransactionResult);
  const publishAndDeploy = jest.fn(async () => commonTransactionResult);
  const registerAsset = jest.fn(async () => commonTransactionResult);
  const readClient = {};
  const read = jest.fn(() => readClient);
  const invoke = jest.fn(async () => commonTransactionResult);
  const invokeSend = jest.fn(async () => commonTransactionResult);
  const invokeRefundAssets = jest.fn(async () => commonTransactionResult);
  const invokeCompleteSend = jest.fn(async () => commonTransactionResult);
  const invokeClaim = jest.fn(async () => commonTransactionResult);
  const commonRawCallReceipt = factory.createRawCallReceipt();
  const call = jest.fn(async () => commonRawCallReceipt);
  const iterBlocks = jest.fn();
  const getBlockCount = jest.fn();
  const getAccount = jest.fn();
  const iterActionsRaw = jest.fn();
  let transfer: jest.Mock<Promise<TransactionResult>>;
  let transfer1: jest.Mock<Promise<TransactionResult>>;
  let issue: jest.Mock<Promise<TransactionResult>>;
  let issue1: jest.Mock<Promise<TransactionResult>>;

  let provider: UserAccountProvider;
  let provider1: UserAccountProvider;
  let client: Client;
  beforeEach(() => {
    transfer = jest.fn(async () => factory.createTransactionResult());
    transfer1 = jest.fn(async () => factory.createTransactionResult());
    issue = jest.fn(async () => factory.createTransactionResult());
    issue1 = jest.fn(async () => factory.createTransactionResult());

    provider = {
      currentUserAccount$: _of(unlockedWallet.account),
      userAccounts$: _of([unlockedWallet.account]),
      networks$: _of([unlockedWallet.account.id.network]),
      getCurrentUserAccount: jest.fn(() => unlockedWallet.account),
      getUserAccounts: jest.fn(() => [unlockedWallet.account]),
      getNetworks: jest.fn(() => [unlockedWallet.account.id.network]),
      selectUserAccount,
      deleteUserAccount,
      updateUserAccountName,
      transfer,
      claim,
      publish,
      publishAndDeploy,
      registerAsset,
      issue,
      read,
      invoke,
      invokeSend,
      invokeRefundAssets,
      invokeCompleteSend,
      invokeClaim,
      call,
      iterBlocks,
      getBlockCount,
      getAccount,
      iterActionsRaw,
    };
    provider1 = {
      currentUserAccount$: _of(unlockedWallet1.account),
      userAccounts$: _of([unlockedWallet1.account]),
      networks$: _of([unlockedWallet1.account.id.network]),
      getCurrentUserAccount: jest.fn(() => unlockedWallet1.account),
      getUserAccounts: jest.fn(() => [unlockedWallet1.account]),
      getNetworks: jest.fn(() => [unlockedWallet1.account.id.network]),
      selectUserAccount: jest.fn(),
      deleteUserAccount: jest.fn(),
      updateUserAccountName: jest.fn(),
      transfer: transfer1,
      claim: jest.fn(async () => Promise.resolve()),
      publish: jest.fn(async () => Promise.resolve()),
      publishAndDeploy: jest.fn(async () => Promise.resolve()),
      registerAsset: jest.fn(async () => Promise.resolve()),
      issue: issue1,
      read: jest.fn(),
      invoke: jest.fn(async () => Promise.resolve()),
      invokeSend: jest.fn(async () => Promise.resolve()),
      invokeRefundAssets: jest.fn(async () => Promise.resolve()),
      invokeCompleteSend: jest.fn(async () => Promise.resolve()),
      invokeClaim: jest.fn(async () => Promise.resolve()),
      call: jest.fn(),
      iterBlocks,
      getBlockCount,
      getAccount,
      iterActionsRaw,
    };
    client = new Client({ [type]: provider, [type1]: provider1 });
  });

  test('constructor throws on no provider', () => {
    const result = () => new Client<{}>({});

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('constructor automatically selects an account', async () => {
    const localGetCurrentAccount = jest
      .fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => undefined);
    const localSelectAccount = jest.fn();

    client = new Client({
      [type]: { ...provider, getCurrentUserAccount: localGetCurrentAccount, selectUserAccount: localSelectAccount },
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 10));

    expect(localSelectAccount.mock.calls).toMatchSnapshot();
  });

  test('constructor does not automatically select an account if one exists at the time of selection', async () => {
    const localGetCurrentAccount = jest
      .fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => unlockedWallet.account);
    const localSelectAccount = jest.fn();

    client = new Client({
      [type]: { ...provider, getCurrentUserAccount: localGetCurrentAccount, selectUserAccount: localSelectAccount },
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 10));

    expect(localSelectAccount.mock.calls).toMatchSnapshot();
  });

  test('currentUserAccount$', async () => {
    const result = await client.currentUserAccount$.pipe(take(1)).toPromise();

    expect(result).toEqual(unlockedWallet.account);
  });

  test('userAccounts$', async () => {
    const result = await client.userAccounts$.pipe(take(1)).toPromise();

    expect(result).toEqual([unlockedWallet.account, unlockedWallet1.account]);
  });

  test('networks$', async () => {
    const result = await client.networks$.pipe(take(1)).toPromise();

    expect(result).toEqual([unlockedWallet.account.id.network]);
  });

  test('getUserAccount', () => {
    const result = client.getUserAccount(unlockedWallet.account.id);

    expect(result).toEqual(unlockedWallet.account);
  });

  test('getUserAccount - throws on unknown account', () => {
    const result = () => client.getUserAccount(lockedWallet.account.id);

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('selectUserAccount', async () => {
    await client.selectUserAccount(unlockedWallet1.account.id);

    expect(selectUserAccount.mock.calls).toMatchSnapshot();
    expect(client.getCurrentUserAccount()).toEqual(unlockedWallet1.account);
  });

  test('deleteUserAccount', async () => {
    await client.deleteUserAccount(unlockedWallet.account.id);

    expect(deleteUserAccount.mock.calls).toMatchSnapshot();
  });

  test('updateUserAccountName', async () => {
    await client.updateUserAccountName({ id: unlockedWallet.account.id, name: 'newName' });

    expect(updateUserAccountName.mock.calls).toMatchSnapshot();
  });

  test('getUserAccounts', () => {
    const result = client.getUserAccounts();

    expect(result).toEqual([unlockedWallet.account, unlockedWallet1.account]);
  });

  test('getNetworks', () => {
    const result = client.getNetworks();

    expect(result).toEqual([unlockedWallet.account.id.network]);
  });

  test('transfer - simple', async () => {
    const transactionResult = factory.createTransactionResult();
    transfer.mockImplementation(async () => transactionResult);

    const result = await client.transfer(data.bigNumbers.a, Hash256.NEO, keys[0].address);

    expect(transfer.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(transactionResult.transaction);
  });

  test('transfer - array', async () => {
    const transactionResult = factory.createTransactionResult();
    transfer1.mockImplementation(async () => transactionResult);

    const result = await client.transfer([{ amount: data.bigNumbers.a, asset: Hash256.NEO, to: keys[0].address }], {
      from: unlockedWallet1.account.id,
    });

    expect(transfer1.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(transactionResult.transaction);
  });

  test('claim', async () => {
    const result = await client.claim();

    expect(transfer.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);
  });

  test('publish', async () => {
    const contract = factory.createContractRegister();
    const result = await client.publish(contract);

    expect(publish.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);
  });

  test('publishAndDeploy', async () => {
    const contract = factory.createContractRegister();
    const result = await client.publishAndDeploy(contract, { functions: [factory.createDeployABIFunction()] });

    expect(publishAndDeploy.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);
  });

  test('registerAsset', async () => {
    const asset = factory.createAssetRegister();
    const result = await client.registerAsset(asset);

    expect(registerAsset.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);
  });

  test('issue - simple', async () => {
    const transactionResult = factory.createTransactionResult();
    issue.mockImplementation(async () => transactionResult);

    const result = await client.issue(data.bigNumbers.a, Hash256.NEO, keys[0].address);

    expect(issue.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(transactionResult.transaction);
  });

  test('issue - array', async () => {
    const transactionResult = factory.createTransactionResult();
    issue1.mockImplementation(async () => transactionResult);

    const result = await client.issue([{ amount: data.bigNumbers.a, asset: Hash256.NEO, to: keys[0].address }], {
      from: unlockedWallet1.account.id,
    });

    expect(issue1.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(transactionResult.transaction);
  });

  test('read', () => {
    const result = client.read(lockedWallet.account.id.network);

    expect(read.mock.calls).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });

  test('read - throws on unknown network', () => {
    const result = () => client.read('unknown');

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('smartContract', () => {
    const result = client.smartContract(factory.createSmartContractDefinition());

    expect(result).toMatchSnapshot();
  });

  test('__invoke', async () => {
    const result = await client.__invoke(keys[0].address, 'deploy', [], [], true);

    expect(invoke.mock.calls).toMatchSnapshot();
    expect(result.transaction).toEqual(commonTransactionResult.transaction);
  });

  test('__call', async () => {
    const result = await client.__call(unlockedWallet.account.id.network, keys[0].address, 'deploy', []);

    expect(call.mock.calls).toMatchSnapshot();
    expect(result).toEqual(commonRawCallReceipt);
  });
});
