/* @flow */
import DeveloperClient from '../DeveloperClient';
import NEOONEDataProvider from '../provider/neoone/NEOONEDataProvider';

describe('DeveloperClient', () => {
  const provider = new NEOONEDataProvider({
    network: 'net',
    rpcURL: 'rpc',
  });
  const developerClient = new DeveloperClient(provider);

  test('runConsensusNow', async () => {
    // $FlowFixMe
    provider.runConsensusNow = jest.fn();
    const result = await developerClient.runConsensusNow();

    expect(result).toBeUndefined();
  });

  test('updateSettings', async () => {
    // $FlowFixMe
    provider.updateSettings = jest.fn();
    const result = await developerClient.updateSettings({
      secondsPerBlock: 10,
    });

    expect(result).toBeUndefined();
  });

  test('fastForwardOffset', async () => {
    // $FlowFixMe
    provider.fastForwardOffset = jest.fn();
    const result = await developerClient.fastForwardOffset(10);

    expect(result).toBeUndefined();
  });

  test('fastForwardOffset', async () => {
    // $FlowFixMe
    provider.fastForwardToTime = jest.fn();
    const result = await developerClient.fastForwardToTime(10);

    expect(result).toBeUndefined();
  });
});
