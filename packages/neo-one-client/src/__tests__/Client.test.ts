import { of as _of } from 'rxjs';
import { take } from 'rxjs/operators';
import { data, factory, keys } from '../__data__';
import { Client } from '../Client';
import { Hash256 } from '../Hash256';
import { TransactionResult, UserAccountProvider } from '../types';

describe('Client', () => {
  const type = 'memory';
  const type1 = 'local';
  const unlockedWallet = factory.createUnlockedWallet();
  const unlockedWallet1 = factory.createUnlockedWallet({
    account: factory.createUserAccount({ id: factory.createUserAccountID({ address: keys[2].address }) }),
  });
  const lockedWallet = factory.createLockedWallet();
  const selectAccount = jest.fn();
  const deleteAccount = jest.fn();
  const updateAccountName = jest.fn();
  const commonTransactionResult = factory.createTransactionResult();
  const claim = jest.fn(() => commonTransactionResult);
  const publish = jest.fn(() => commonTransactionResult);
  const publishAndDeploy = jest.fn(() => commonTransactionResult);
  const registerAsset = jest.fn(() => commonTransactionResult);
  const readClient = {};
  const read = jest.fn(() => readClient);
  const invoke = jest.fn(() => commonTransactionResult);
  const commonRawCallReceipt = factory.createRawCallReceipt();
  const call = jest.fn(() => commonRawCallReceipt);
  let transfer: jest.Mock<TransactionResult>;
  let transfer1: jest.Mock<TransactionResult>;
  let issue: jest.Mock<TransactionResult>;
  let issue1: jest.Mock<TransactionResult>;

  let provider: UserAccountProvider;
  let provider1: UserAccountProvider;
  let client: Client;
  beforeEach(() => {
    transfer = jest.fn(() => factory.createTransactionResult());
    transfer1 = jest.fn(() => factory.createTransactionResult());
    issue = jest.fn(() => factory.createTransactionResult());
    issue1 = jest.fn(() => factory.createTransactionResult());

    provider = {
      type,
      currentAccount$: _of(unlockedWallet.account),
      accounts$: _of([unlockedWallet.account]),
      networks$: _of([unlockedWallet.account.id.network]),
      getCurrentAccount: jest.fn(() => unlockedWallet.account),
      getAccounts: jest.fn(() => [unlockedWallet.account]),
      getNetworks: jest.fn(() => [unlockedWallet.account.id.network]),
      selectAccount,
      deleteAccount,
      updateAccountName,
      transfer,
      claim,
      publish,
      publishAndDeploy,
      registerAsset,
      issue,
      read,
      invoke,
      call,
    };
    provider1 = {
      type: type1,
      currentAccount$: _of(unlockedWallet1.account),
      accounts$: _of([unlockedWallet1.account]),
      networks$: _of([unlockedWallet1.account.id.network]),
      getCurrentAccount: jest.fn(() => unlockedWallet1.account),
      getAccounts: jest.fn(() => [unlockedWallet1.account]),
      getNetworks: jest.fn(() => [unlockedWallet1.account.id.network]),
      selectAccount: jest.fn(),
      deleteAccount: jest.fn(),
      updateAccountName: jest.fn(),
      transfer: transfer1,
      claim: jest.fn(),
      publish: jest.fn(),
      publishAndDeploy: jest.fn(),
      registerAsset: jest.fn(),
      issue: issue1,
      read: jest.fn(),
      invoke: jest.fn(),
      call: jest.fn(),
    };
    client = new Client({ [type]: provider, [type1]: provider1 });
  });

  test('constructor throws on no provider', () => {
    const result = () => new Client<{}>({});

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('constructor throws on invalid provider key', () => {
    const result = () => new Client({ ['some-other-type']: provider });

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
      [type]: { ...provider, getCurrentAccount: localGetCurrentAccount, selectAccount: localSelectAccount },
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
      [type]: { ...provider, getCurrentAccount: localGetCurrentAccount, selectAccount: localSelectAccount },
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 10));

    expect(localSelectAccount.mock.calls).toMatchSnapshot();
  });

  test('currentAccount$', async () => {
    const result = await client.currentAccount$.pipe(take(1)).toPromise();

    expect(result).toEqual(unlockedWallet.account);
  });

  test('accounts$', async () => {
    const result = await client.accounts$.pipe(take(1)).toPromise();

    expect(result).toEqual([unlockedWallet.account, unlockedWallet1.account]);
  });

  test('networks$', async () => {
    const result = await client.networks$.pipe(take(1)).toPromise();

    expect(result).toEqual([unlockedWallet.account.id.network]);
  });

  test('getAccount', () => {
    const result = client.getAccount(unlockedWallet.account.id);

    expect(result).toEqual(unlockedWallet.account);
  });

  test('getAccount - throws on unknown account', () => {
    const result = () => client.getAccount(lockedWallet.account.id);

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('selectAccount', async () => {
    await client.selectAccount(unlockedWallet1.account.id);

    expect(selectAccount.mock.calls).toMatchSnapshot();
    expect(client.getCurrentAccount()).toEqual(unlockedWallet1.account);
  });

  test('deleteAccount', async () => {
    await client.deleteAccount(unlockedWallet.account.id);

    expect(deleteAccount.mock.calls).toMatchSnapshot();
  });

  test('updateAccountName', async () => {
    await client.updateAccountName({ id: unlockedWallet.account.id, name: 'newName' });

    expect(updateAccountName.mock.calls).toMatchSnapshot();
  });

  test('getAccounts', () => {
    const result = client.getAccounts();

    expect(result).toEqual([unlockedWallet.account, unlockedWallet1.account]);
  });

  test('getNetworks', () => {
    const result = client.getNetworks();

    expect(result).toEqual([unlockedWallet.account.id.network]);
  });

  test('inject', () => {
    Client.inject(provider1);

    expect(client.getCurrentAccount()).toEqual(unlockedWallet1.account);
  });

  test('transfer - simple', async () => {
    const transactionResult = factory.createTransactionResult();
    transfer.mockImplementation(() => transactionResult);

    const result = await client.transfer(data.bigNumbers.a, Hash256.NEO, keys[0].address);

    expect(transfer.mock.calls).toMatchSnapshot();
    expect(result).toEqual(transactionResult);
  });

  test('transfer - array', async () => {
    const transactionResult = factory.createTransactionResult();
    transfer1.mockImplementation(() => transactionResult);

    const result = await client.transfer([{ amount: data.bigNumbers.a, asset: Hash256.NEO, to: keys[0].address }], {
      from: unlockedWallet1.account.id,
    });

    expect(transfer1.mock.calls).toMatchSnapshot();
    expect(result).toEqual(transactionResult);
  });

  test('claim', async () => {
    const result = await client.claim();

    expect(transfer.mock.calls).toMatchSnapshot();
    expect(result).toEqual(commonTransactionResult);
  });

  test('publish', async () => {
    const contract = factory.createContractRegister();
    const result = await client.publish(contract);

    expect(publish.mock.calls).toMatchSnapshot();
    expect(result).toEqual(commonTransactionResult);
  });

  test('publishAndDeploy', async () => {
    const contract = factory.createContractRegister();
    const result = await client.publishAndDeploy(contract, { functions: [factory.createDeployABIFunction()] });

    expect(publishAndDeploy.mock.calls).toMatchSnapshot();
    expect(result).toEqual(commonTransactionResult);
  });

  test('registerAsset', async () => {
    const asset = factory.createAssetRegister();
    const result = await client.registerAsset(asset);

    expect(registerAsset.mock.calls).toMatchSnapshot();
    expect(result).toEqual(commonTransactionResult);
  });

  test('issue - simple', async () => {
    const transactionResult = factory.createTransactionResult();
    issue.mockImplementation(() => transactionResult);

    const result = await client.issue(data.bigNumbers.a, Hash256.NEO, keys[0].address);

    expect(issue.mock.calls).toMatchSnapshot();
    expect(result).toEqual(transactionResult);
  });

  test('issue - array', async () => {
    const transactionResult = factory.createTransactionResult();
    issue1.mockImplementation(() => transactionResult);

    const result = await client.issue([{ amount: data.bigNumbers.a, asset: Hash256.NEO, to: keys[0].address }], {
      from: unlockedWallet1.account.id,
    });

    expect(issue1.mock.calls).toMatchSnapshot();
    expect(result).toEqual(transactionResult);
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
    expect(result).toEqual(commonTransactionResult);
  });

  test('__call', async () => {
    const result = await client.__call(unlockedWallet.account.id.network, keys[0].address, 'deploy', []);

    expect(call.mock.calls).toMatchSnapshot();
    expect(result).toEqual(commonRawCallReceipt);
  });
});
