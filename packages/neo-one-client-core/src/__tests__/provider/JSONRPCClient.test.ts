// tslint:disable no-object-mutation
import { data, factory, keys } from '../../__data__';
import { JSONRPCError, RelayTransactionError } from '../../errors';
import { JSONRPCClient, JSONRPCProvider } from '../../provider';

const mockRequest = jest.fn();
class MockJSONRPCProvider extends JSONRPCProvider {
  // tslint:disable-next-line readonly-keyword
  public request = mockRequest;
}

describe('JSONRPCClient', () => {
  const provider = new MockJSONRPCProvider();
  const client = new JSONRPCClient(provider);

  beforeEach(() => {
    mockRequest.mockReset();
  });

  test('getAccount', async () => {
    const value = factory.createAccountJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getAccount(keys[0].address);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getAsset', async () => {
    const value = factory.createAssetJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getAsset(data.hash256s.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getBlock - hash', async () => {
    const value = factory.createBlockJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getBlock(data.hash256s.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getBlock - index', async () => {
    const value = factory.createBlockJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getBlock(10, { timeoutMS: 1000 });

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getBestBlockHash', async () => {
    const value = data.hash256s.a;
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getBestBlockHash();

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getBlockCount', async () => {
    const value = 10;
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getBlockCount();

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getContract', async () => {
    const value = factory.createContractJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getContract(keys[0].address);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getMemPool', async () => {
    const value = [data.hash256s.a];
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getMemPool();

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getTransaction', async () => {
    const value = factory.createInvocationTransactionJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getTransaction(data.hash256s.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getUnspentOutput - defined', async () => {
    const value = factory.createOutputJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getUnspentOutput(factory.createInputJSON());

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getUnspentOutput - undefined', async () => {
    const value = undefined;
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getUnspentOutput(factory.createInputJSON());

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('testInvokeRaw', async () => {
    const value = factory.createInvocationResultSuccessJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.testInvokeRaw(data.buffers.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('relayTransaction', async () => {
    const value = factory.createInvocationTransactionJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.relayTransaction(data.buffers.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('relayTransaction - relay error', async () => {
    const message = 'error';
    const rpcErr = new JSONRPCError({ message, code: -110 });
    mockRequest.mockImplementationOnce(async () => Promise.reject(rpcErr));

    const result = client.relayTransaction(data.buffers.a);

    await expect(result).rejects.toEqual(new RelayTransactionError(message));
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('relayTransaction - other error', async () => {
    const error = new Error('error');
    mockRequest.mockImplementationOnce(async () => Promise.reject(error));

    const result = client.relayTransaction(data.buffers.a);

    await expect(result).rejects.toEqual(error);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getOutput', async () => {
    const value = factory.createOutputJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getOutput(factory.createInputJSON());

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getClaimAmount', async () => {
    const value = data.bigNumbers.a.toString(10);
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getClaimAmount(factory.createInputJSON());

    expect(result.toString(10)).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getAllStorage', async () => {
    const value = [factory.createStorageItemJSON()];
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getAllStorage(keys[0].address);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('testInvocation', async () => {
    const value = factory.createCallReceiptJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.testInvocation(data.buffers.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getTransactionReceipt', async () => {
    const value = factory.createTransactionReceipt();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getTransactionReceipt(data.hash256s.a, { timeoutMS: 1000 });

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getInvocationData', async () => {
    const value = factory.createInvocationDataJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getInvocationData(data.hash256s.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getConnectedPeers', async () => {
    const value = { connected: [factory.createPeerJSON()] };
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getConnectedPeers();

    expect(result).toEqual(value.connected);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getNetworkSettings', async () => {
    const value = factory.createNetworkSettingsJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getNetworkSettings();

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('runConsensusNow', async () => {
    mockRequest.mockImplementationOnce(async () => Promise.resolve());

    await client.runConsensusNow();

    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('updateSettings', async () => {
    mockRequest.mockImplementationOnce(async () => Promise.resolve());

    await client.updateSettings({ secondsPerBlock: 10 });

    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('fastForwardOffset', async () => {
    mockRequest.mockImplementationOnce(async () => Promise.resolve());

    await client.fastForwardOffset(10);

    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('fastForwardToTime', async () => {
    mockRequest.mockImplementationOnce(async () => Promise.resolve());

    await client.fastForwardToTime(10);

    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('reset', async () => {
    mockRequest.mockImplementationOnce(async () => Promise.resolve());

    await client.reset();

    expect(mockRequest.mock.calls).toMatchSnapshot();
  });
});
