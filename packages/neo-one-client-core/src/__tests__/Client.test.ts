// tslint:disable no-object-mutation
import { RawAction, UserAccountProvider } from '@neo-one/client-common';
import { Modifiable } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable';
import { of, of as _of } from 'rxjs';
import { factory, keys } from '../__data__';
import { Client } from '../Client';
import { DeleteUserAccountUnsupportedError, UpdateUserAccountUnsupportedError } from '../errors';
import { UnlockedWallet } from '../user';

const getMockProvider = (wallet: UnlockedWallet) => {
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
  const transfer = jest.fn(async () => factory.createTransactionResult());

  return {
    currentUserAccount$: _of(wallet.userAccount),
    userAccounts$: _of([wallet.userAccount]),
    networks$: _of([wallet.userAccount.id.network]),
    getCurrentUserAccount: jest.fn(() => wallet.userAccount),
    getUserAccounts: jest.fn(() => [wallet.userAccount]),
    getNetworks: jest.fn(() => [wallet.userAccount.id.network]),
    selectUserAccount,
    deleteUserAccount,
    updateUserAccountName,
    transfer,
    claim,
    publish,
    publishAndDeploy,
    registerAsset,
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
};

describe('Client Tests', () => {
  const walletOne = factory.createUnlockedWallet();
  const walletTwo = factory.createOtherWallet({
    userAccount: factory.createUserAccount({
      id: factory.createUserAccountID({
        address: keys[1].address,
        network: 'test',
      }),
    }),
  });

  let providerOne: Modifiable<UserAccountProvider>;
  let providerTwo: Modifiable<UserAccountProvider>;
  let client: Client;
  beforeEach(() => {
    // tslint:disable:no-any
    providerOne = getMockProvider(walletOne) as any;
    providerTwo = getMockProvider(walletTwo) as any;
    // tslint:enable:no-any

    client = new Client({
      main: providerOne,
      test: providerTwo,
    });
  });

  test('select network', async () => {
    expect(client.getCurrentNetwork()).toEqual('main');

    await client.selectNetwork('test');

    expect(client.getCurrentNetwork()).toEqual('test');
  });

  test('select network - no selected account', async () => {
    expect(client.getCurrentNetwork()).toEqual('main');
    providerTwo.getCurrentUserAccount = jest.fn();
    providerTwo.selectUserAccount = jest.fn();

    await client.selectNetwork('test');

    expect(client.getCurrentNetwork()).toEqual('test');
    expect(providerTwo.selectUserAccount).toHaveBeenCalledTimes(1);
  });

  test('iterActionsRaw - defined on provider', async () => {
    providerOne.iterActionsRaw = jest.fn();
    client.__iterActionsRaw('main');

    expect(providerOne.iterActionsRaw).toHaveBeenCalledTimes(1);
  });

  test('iterActionsRaw - undefined on provider', async () => {
    const actions = [factory.createRawNotification(), factory.createRawLog()];
    const invocationData = factory.createRawInvocationData({ actions });
    const invocationTransaction = factory.createConfirmedTransaction({ invocationData });
    const block = factory.createBlock({
      transactions: [invocationTransaction, factory.createConfirmedTransaction()],
    });
    providerOne.iterActionsRaw = undefined;
    providerOne.iterBlocks = jest.fn(() => AsyncIterableX.from(of(block)));

    const iterable = client.__iterActionsRaw('main');

    let result: readonly RawAction[] = [];

    // tslint:disable-next-line:no-loop-statement
    for await (const value of iterable) {
      result = result.concat(value);
    }

    expect(result).toEqual(actions);
  });

  test('getSupportedFeatures - both', async () => {
    const id = walletOne.userAccount.id;
    const result = await client.getSupportedFeatures(id);

    expect(result).toEqual({
      delete: true,
      updateName: true,
    });
  });

  test('getSupportedFeatures - neither', async () => {
    providerOne.deleteUserAccount = undefined;
    providerOne.updateUserAccountName = undefined;
    const id = walletOne.userAccount.id;
    const result = await client.getSupportedFeatures(id);

    expect(result).toEqual({
      delete: false,
      updateName: false,
    });
  });

  test('deleteUserAccount throws when not available', async () => {
    providerOne.deleteUserAccount = undefined;
    const id = walletOne.userAccount.id;
    const deleteThrows = client.deleteUserAccount(id);

    await expect(deleteThrows).rejects.toEqual(new DeleteUserAccountUnsupportedError(id));
  });

  test('updateUserAccountName throws when not available', async () => {
    providerOne.updateUserAccountName = undefined;
    const id = walletOne.userAccount.id;
    const updateNameThrows = client.updateUserAccountName({ id, name: 'test' });

    await expect(updateNameThrows).rejects.toEqual(new UpdateUserAccountUnsupportedError(id));
  });
});
