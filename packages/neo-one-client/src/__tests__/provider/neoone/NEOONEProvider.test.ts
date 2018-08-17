// tslint:disable no-object-mutation
import { take } from 'rxjs/operators';
import { data, factory, keys } from '../../../__data__';
import { NEOONEDataProvider, NEOONEProvider } from '../../../provider';

jest.mock('../../../provider/neoone/NEOONEDataProvider');

describe('NEOONEProvider', () => {
  const network = 'main';
  const rpcURL = 'https://neotracker.io/rpc';

  let provider: NEOONEProvider;
  let dataProvider: Modifiable<NEOONEDataProvider>;
  beforeEach(() => {
    provider = new NEOONEProvider([{ network, rpcURL }]);
    // tslint:disable-next-line no-any
    dataProvider = (provider as any).mutableProviders[network];
  });

  test('networks$', async () => {
    const result = await provider.networks$.pipe(take(1)).toPromise();

    expect(result).toEqual([network]);
  });

  test('networks$ - no networks', async () => {
    const prov = new NEOONEProvider();

    const result = await prov.networks$.pipe(take(1)).toPromise();

    expect(result).toEqual([]);
  });

  test('getNetworks', () => {
    const result = provider.getNetworks();

    expect(result).toEqual([network]);
  });

  test('getNetworks - no networks', () => {
    const prov = new NEOONEProvider();

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
    const expected = factory.createMinerTransaction();
    dataProvider.relayTransaction = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.relayTransaction(network, data.buffers.a);

    expect(result).toBe(expected);
  });

  test('getTransactionReceipt', async () => {
    const expected = factory.createTransactionReceipt();
    dataProvider.getTransactionReceipt = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.getTransactionReceipt(network, data.hash256s.a);

    expect(result).toBe(expected);
  });

  test('getInvocationData', async () => {
    const expected = factory.createRawInvocationData();
    dataProvider.getInvocationData = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.getInvocationData(network, data.hash256s.a);

    expect(result).toBe(expected);
  });

  test('testInvoke', async () => {
    const expected = factory.createRawCallReceipt();
    dataProvider.testInvoke = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.testInvoke(network, data.buffers.a);

    expect(result).toBe(expected);
  });

  test('getNetworkSettings', async () => {
    const expected = factory.createNetworkSettings();
    dataProvider.getNetworkSettings = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.getNetworkSettings(network);

    expect(result).toBe(expected);
  });

  test('getBlockCount', async () => {
    const expected = 10;
    dataProvider.getBlockCount = jest.fn(async () => Promise.resolve(expected));

    const result = await provider.getBlockCount(network);

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
