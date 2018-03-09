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
    expect(provider.runConsensusNow).toHaveBeenCalledWith();
    expect(provider.runConsensusNow).toHaveBeenCalledTimes(1);
  });

  test('updateSettings', async () => {
    const options = { secondsPerBlock: 10 };
    // $FlowFixMe
    provider.updateSettings = jest.fn();
    const result = await developerClient.updateSettings(options);

    expect(result).toBeUndefined();
    expect(provider.updateSettings).toHaveBeenCalledWith(options);
    expect(provider.updateSettings).toHaveBeenCalledTimes(1);
  });

  test('fastForwardOffset', async () => {
    const offset = 10;
    // $FlowFixMe
    provider.fastForwardOffset = jest.fn();
    const result = await developerClient.fastForwardOffset(offset);

    expect(result).toBeUndefined();
    expect(provider.fastForwardOffset).toHaveBeenCalledWith(offset);
    expect(provider.fastForwardOffset).toHaveBeenCalledTimes(1);
  });

  test('fastForwardOffset', async () => {
    const time = 10;
    // $FlowFixMe
    provider.fastForwardToTime = jest.fn();
    const result = await developerClient.fastForwardToTime(time);

    expect(result).toBeUndefined();
    expect(provider.fastForwardOffset).toHaveBeenCalledWith(time);
    expect(provider.fastForwardOffset).toHaveBeenCalledTimes(1);
  });
});
