// tslint:disable no-object-mutation
import BigNumber from 'bignumber.js';
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

  test('getBlockHeader - hash', async () => {
    const value = factory.createHeaderJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getBlockHeader(data.hash256s.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getBlockHeader - index', async () => {
    const value = factory.createHeaderJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getBlockHeader(10, { timeoutMS: 1000 });

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

  test('getBlockHash', async () => {
    const value = data.hash256s.a;
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getBlockHash(10);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getBlockSysFee', async () => {
    const value = new BigNumber('10');
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getBlockSysFee(10);

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
    const value = factory.createTransactionJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getTransaction(data.hash256s.a, { timeoutMS: 1000 });

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getTransactionHeight', async () => {
    const value = 1000;
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getTransactionHeight(data.hash256s.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getStorage', async () => {
    const value = [factory.createStorageItemJSON()];
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getStorage(keys[0].address, data.buffers.b);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getValidators', async () => {
    const value = [factory.createValidatorJSON()];
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getValidators();

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

  test('getConnectionCount', async () => {
    const value = 9;
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getConnectionCount();

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('getVersion', async () => {
    const value = factory.createVersionJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.getVersion();

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('invokeScript', async () => {
    const value = factory.createInvocationResultSuccessJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.invokeScript(data.buffers.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('invokeFunction', async () => {
    const value = factory.createInvocationResultErrorJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.invokeFunction(keys[0].address, 'balanceOf', [
      { name: 'param', type: 'Hash160', value: keys[1].address },
    ]);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('sendTransaction', async () => {
    const value = factory.createTransactionJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.sendTransaction(data.buffers.a);

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('sendTransaction - relay error', async () => {
    const message = 'error';
    const rpcErr = new JSONRPCError({ message, code: -110 });
    mockRequest.mockImplementationOnce(async () => Promise.reject(rpcErr));

    const result = client.sendTransaction(data.buffers.a);

    await expect(result).rejects.toEqual(new RelayTransactionError(message));
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('sendTransaction - other error', async () => {
    const error = new Error('error');
    mockRequest.mockImplementationOnce(async () => Promise.reject(error));

    const result = client.sendTransaction(data.buffers.a);

    await expect(result).rejects.toEqual(error);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  test('listPlugins', async () => {
    const value = factory.createPluginJSON();
    mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

    const result = await client.listPlugins();

    expect(result).toEqual(value);
    expect(mockRequest.mock.calls).toMatchSnapshot();
  });

  // test('getNetworkSettings', async () => {
  //   const value = factory.createNetworkSettingsJSON();
  //   mockRequest.mockImplementationOnce(async () => Promise.resolve(value));

  //   const result = await client.getNetworkSettings();

  //   expect(result).toEqual(value);
  //   expect(mockRequest.mock.calls).toMatchSnapshot();
  // });

  // test('runConsensusNow', async () => {
  //   mockRequest.mockImplementationOnce(async () => Promise.resolve());

  //   await client.runConsensusNow();

  //   expect(mockRequest.mock.calls).toMatchSnapshot();
  // });

  // test('updateSettings', async () => {
  //   mockRequest.mockImplementationOnce(async () => Promise.resolve());

  //   await client.updateSettings({ secondsPerBlock: 10 });

  //   expect(mockRequest.mock.calls).toMatchSnapshot();
  // });

  // test('fastForwardOffset', async () => {
  //   mockRequest.mockImplementationOnce(async () => Promise.resolve());

  //   await client.fastForwardOffset(10);

  //   expect(mockRequest.mock.calls).toMatchSnapshot();
  // });

  // test('fastForwardToTime', async () => {
  //   mockRequest.mockImplementationOnce(async () => Promise.resolve());

  //   await client.fastForwardToTime(10);

  //   expect(mockRequest.mock.calls).toMatchSnapshot();
  // });

  // test('reset', async () => {
  //   mockRequest.mockImplementationOnce(async () => Promise.resolve());

  //   await client.reset();

  //   expect(mockRequest.mock.calls).toMatchSnapshot();
  // });
});
