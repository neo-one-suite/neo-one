// tslint:disable no-object-mutation
import { Modifiable } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable';
import BigNumber from 'bignumber.js';
import { take } from 'rxjs/operators';
import { data, factory, keys } from '../../__data__';
import { NEODataProvider, NEOProvider } from '../../provider';

jest.mock('../../provider/NEODataProvider');

describe('NEOONEProvider', () => {
  const network = 'main';
  const rpcURL = 'https://neotracker.io/rpc';

  let provider: NEOProvider;
  let dataProvider: Modifiable<NEODataProvider>;
  beforeEach(() => {
    provider = new NEOProvider([{ network, rpcURL }]);
    // tslint:disable-next-line no-any
    dataProvider = (provider as any).mutableProviders[network];
  });

  test('networks$', async () => {
    const result = await provider.networks$.pipe(take(1)).toPromise();

    expect(result).toEqual([network]);
  });

  test('networks$ - no networks', async () => {
    const prov = new NEOProvider();

    const result = await prov.networks$.pipe(take(1)).toPromise();

    expect(result).toEqual([]);
  });

  test('getNetworks', () => {
    const result = provider.getNetworks();

    expect(result).toEqual([network]);
  });

  test('getNetworks - no networks', () => {
    const prov = new NEOProvider();

    const result = prov.getNetworks();

    expect(result).toEqual([]);
  });

  test('addNetwork', () => {
    const newNetwork = 'test';

    provider.addNetwork({ network: newNetwork, rpcURL: 'https://test.neotracker.io/rpc' });
    const result = provider.getNetworks();

    expect(result).toEqual([network, newNetwork]);
  });

  test('addNetwork - existing network', () => {
    provider.addNetwork({ network, rpcURL });
    const result = provider.getNetworks();

    expect(result).toEqual([network]);
  });

  test('getUnclaimed', async () => {
    const expected = { unclaimed: [factory.createInput()], amount: data.bigNumbers.a };
    dataProvider.getUnclaimed = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.getUnclaimed(network, keys[0].address);

    expect(result).toBe(expected);
  });

  test('getUnspentOutputs', async () => {
    const expected = [factory.createInputOutput()];
    dataProvider.getUnspentOutputs = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.getUnspentOutputs(network, keys[0].address);

    expect(result).toBe(expected);
  });

  test('relayTransaction', async () => {
    const expected = factory.createInvocationTransaction();
    // tslint:disable-next-line:no-any
    dataProvider.relayTransaction = jest.fn((async () => Promise.resolve(expected)) as any);

    const result = await provider.relayTransaction(
      network,
      factory.createInvocationTransactionModel(),
      new BigNumber(0.01),
    );

    expect(result).toBe(expected);
  });

  test('getTransactionReceipt', async () => {
    const expected = factory.createTransactionReceipt({ globalIndex: new BigNumber(-1) });
    dataProvider.getTransactionReceipt = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.getTransactionReceipt(network, data.hash256s.a);

    expect(result).toBe(expected);
  });

  test('getInvocationData', async () => {
    dataProvider.getInvocationData = jest.fn(async () => {
      throw new Error('Not Implemented.');
    });

    const result = provider.getInvocationData(network, data.hash256s.a);

    await expect(result).rejects.toThrowError('Not Implemented');
  });

  test('testInvoke', async () => {
    const expected = factory.createRawCallReceipt({ actions: [] });
    dataProvider.testInvoke = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.testInvoke(network, factory.createInvocationTransactionModel());

    expect(result).toBe(expected);
  });

  test('getClaimAmount', async () => {
    dataProvider.getClaimAmount = jest.fn(async () => {
      throw new Error('Not Implemented.');
    });

    const result = provider.getClaimAmount(network, factory.createInput());

    await expect(result).rejects.toThrowError('Not Implemented');
  });

  test('getNetworkSettings', async () => {
    dataProvider.getNetworkSettings = jest.fn(async () => {
      throw new Error('Not Implemented.');
    });

    const result = provider.getNetworkSettings(network);

    await expect(result).rejects.toThrowError('Not Implemented');
  });

  test('getAccount', async () => {
    const expected = factory.createAccount();
    dataProvider.getAccount = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.getAccount(network, expected.address);

    expect(result).toBe(expected);
  });

  test('getBlockCount', async () => {
    const expected = 10;
    dataProvider.getBlockCount = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.getBlockCount(network);

    expect(result).toBe(expected);
  });

  test('iterActionsRaw', async () => {
    dataProvider.iterActionsRaw = jest.fn(() => {
      throw new Error('Not Implemented.');
    });

    const result = () => provider.iterActionsRaw(network);

    expect(result).toThrowError('Not Implemented');
  });

  test('iterBlocks', async () => {
    const expected = AsyncIterableX.from([factory.createBlock()]);
    dataProvider.iterBlocks = jest.fn(() => expected);

    const result = provider.iterBlocks(network);

    expect(result).toBe(expected);
  });

  test('getBlockCount - unknown network', async () => {
    const result = provider.getBlockCount('unknown');

    await expect(result).rejects.toMatchSnapshot();
  });

  test('read', () => {
    const result = provider.read(network);

    expect(result).toBe(dataProvider);
  });
});
