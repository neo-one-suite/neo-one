// tslint:disable no-object-mutation
import { DeveloperClient } from '../DeveloperClient';
import { NEOONEProvider } from '../provider';

describe('DeveloperClient', () => {
  const networkName = 'main';
  const neoOneProvider = new NEOONEProvider([
    {
      network: networkName,
      rpcURL: 'rpc',
    },
  ]);
  const provider = neoOneProvider.read(networkName);
  const developerClient = new DeveloperClient(provider);

  test('runConsensusNow', async () => {
    provider.runConsensusNow = jest.fn();
    await developerClient.runConsensusNow();

    expect(provider.runConsensusNow).toHaveBeenCalledWith();
    expect(provider.runConsensusNow).toHaveBeenCalledTimes(1);
  });

  test('updateSettings', async () => {
    const options = { secondsPerBlock: 10 };
    provider.updateSettings = jest.fn();
    await developerClient.updateSettings(options);

    expect(provider.updateSettings).toHaveBeenCalledWith(options);
    expect(provider.updateSettings).toHaveBeenCalledTimes(1);
  });

  test('getSettings', async () => {
    const options = { secondsPerBlock: 10 };
    provider.getSettings = jest.fn(async () => Promise.resolve(options));
    const result = await developerClient.getSettings();

    expect(result).toEqual(options);
  });

  test('fastForwardOffset', async () => {
    const offset = 10;
    provider.fastForwardOffset = jest.fn();
    await developerClient.fastForwardOffset(offset);

    expect(provider.fastForwardOffset).toHaveBeenCalledWith(offset);
    expect(provider.fastForwardOffset).toHaveBeenCalledTimes(1);
  });

  test('fastForwardOffset', async () => {
    const time = 10;
    provider.fastForwardToTime = jest.fn();
    await developerClient.fastForwardToTime(time);

    expect(provider.fastForwardOffset).toHaveBeenCalledWith(time);
    expect(provider.fastForwardOffset).toHaveBeenCalledTimes(1);
  });

  test('reset', async () => {
    provider.reset = jest.fn();
    await developerClient.reset();

    expect(provider.reset).toHaveBeenCalledWith();
    expect(provider.reset).toHaveBeenCalledTimes(1);
  });
});
