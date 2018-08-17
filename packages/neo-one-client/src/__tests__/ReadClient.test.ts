import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable';
import { toArray } from '@reactivex/ix-es2015-cjs/asynciterable/toarray';
import { data, factory, keys } from '../__data__';
import { ReadClient } from '../ReadClient';
import { DataProvider } from '../types';

describe('ReadClient', () => {
  const network = 'main';
  const getAccount = jest.fn();
  const getAsset = jest.fn();
  const getBlock = jest.fn();
  const iterBlocks = jest.fn();
  const getBestBlockHash = jest.fn();
  const getBlockCount = jest.fn();
  const getContract = jest.fn();
  const getMemPool = jest.fn();
  const getTransaction = jest.fn();
  const getOutput = jest.fn();
  const getConnectedPeers = jest.fn();
  const getStorage = jest.fn();
  const iterStorage = jest.fn();
  const iterActionsRaw = jest.fn();
  const call = jest.fn();
  const provider: DataProvider = {
    network,
    getAccount,
    getAsset,
    getBlock,
    iterBlocks,
    getBestBlockHash,
    getBlockCount,
    getContract,
    getMemPool,
    getTransaction,
    getOutput,
    getConnectedPeers,
    getStorage,
    iterStorage,
    iterActionsRaw,
    call,
  };
  let client: ReadClient;
  beforeEach(() => {
    client = new ReadClient(provider);
  });

  test('getAccount', async () => {
    const value = factory.createAccount();
    getAccount.mockImplementationOnce(() => value);

    const result = await client.getAccount(keys[0].address);

    expect(result).toEqual(value);
    expect(getAccount.mock.calls).toMatchSnapshot();
  });

  test('getAsset', async () => {
    const value = factory.createAsset();
    getAsset.mockImplementationOnce(() => value);

    const result = await client.getAsset(data.hash256s.a);

    expect(result).toEqual(value);
    expect(getAsset.mock.calls).toMatchSnapshot();
  });

  test('getBlock', async () => {
    const value = factory.createBlock();
    getBlock.mockReset();
    getBlock.mockImplementationOnce(() => value);

    const result = await client.getBlock(data.hash256s.a);

    expect(result).toEqual(value);
    expect(getBlock.mock.calls).toMatchSnapshot();
  });

  test('getBlock - number', async () => {
    const value = factory.createBlock();
    getBlock.mockReset();
    getBlock.mockImplementationOnce(() => value);

    const result = await client.getBlock(0);

    expect(result).toEqual(value);
    expect(getBlock.mock.calls).toMatchSnapshot();
  });

  test('iterBlocks', async () => {
    const value = factory.createBlock();
    iterBlocks.mockImplementationOnce(() => AsyncIterableX.from([value]));

    const result = await toArray(client.iterBlocks({ indexStart: 3, indexStop: 4 }));

    expect(result).toEqual([value]);
    expect(iterBlocks.mock.calls).toMatchSnapshot();
  });

  test('getBestBlockHash', async () => {
    const value = data.hash256s.a;
    getBestBlockHash.mockImplementationOnce(() => value);

    const result = await client.getBestBlockHash();

    expect(result).toEqual(value);
    expect(getBestBlockHash.mock.calls).toMatchSnapshot();
  });

  test('getBlockCount', async () => {
    const value = 10;
    getBlockCount.mockImplementationOnce(() => value);

    const result = await client.getBlockCount();

    expect(result).toEqual(value);
    expect(getBlockCount.mock.calls).toMatchSnapshot();
  });

  test('getContract', async () => {
    const value = factory.createContract();
    getContract.mockImplementationOnce(() => value);

    const result = await client.getContract(keys[0].address);

    expect(result).toEqual(value);
    expect(getContract.mock.calls).toMatchSnapshot();
  });

  test('getMemPool', async () => {
    const value = [data.hash256s.a];
    getMemPool.mockImplementationOnce(() => value);

    const result = await client.getMemPool();

    expect(result).toEqual(value);
    expect(getMemPool.mock.calls).toMatchSnapshot();
  });

  test('getTransaction', async () => {
    const value = factory.createContractTransaction();
    getTransaction.mockImplementationOnce(() => value);

    const result = await client.getTransaction(data.hash256s.a);

    expect(result).toEqual(value);
    expect(getTransaction.mock.calls).toMatchSnapshot();
  });

  test('getOutput', async () => {
    const value = factory.createOutput();
    getOutput.mockImplementationOnce(() => value);

    const result = await client.getOutput(factory.createInput());

    expect(result).toEqual(value);
    expect(getOutput.mock.calls).toMatchSnapshot();
  });

  test('getConnectedPeers', async () => {
    const value = [factory.createPeerJSON()];
    getConnectedPeers.mockImplementationOnce(() => value);

    const result = await client.getConnectedPeers();

    expect(result).toEqual(value);
    expect(getConnectedPeers.mock.calls).toMatchSnapshot();
  });

  test('smartContract', () => {
    const result = client.smartContract(factory.createReadSmartContractDefinition());

    expect(result).toMatchSnapshot();
  });

  test('getStorage', async () => {
    const value = factory.createStorageItem();
    getStorage.mockImplementationOnce(() => value);

    const result = await client.getStorage(keys[0].address, data.buffers.a);

    expect(result).toEqual(value);
    expect(getStorage.mock.calls).toMatchSnapshot();
  });

  test('iterStorage', async () => {
    const value = [factory.createStorageItem()];
    iterStorage.mockImplementationOnce(() => AsyncIterableX.from(value));

    const result = await toArray(client.iterStorage(keys[0].address));

    expect(result).toEqual(value);
    expect(getStorage.mock.calls).toMatchSnapshot();
  });

  test('__iterActionsRaw', async () => {
    const value = [factory.createRawNotification()];
    iterActionsRaw.mockImplementationOnce(() => AsyncIterableX.from(value));

    const result = await toArray(client.__iterActionsRaw());

    expect(result).toEqual(value);
    expect(iterActionsRaw.mock.calls).toMatchSnapshot();
  });

  test('__call', async () => {
    const value = factory.createRawCallReceipt();
    call.mockImplementationOnce(() => value);

    const result = await client.__call(keys[0].address, 'deploy', []);

    expect(result).toEqual(value);
    expect(iterActionsRaw.mock.calls).toMatchSnapshot();
  });
});
