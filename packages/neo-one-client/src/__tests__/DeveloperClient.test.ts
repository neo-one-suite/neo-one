import { DeveloperClient } from '../DeveloperClient';
import { NEOONEProvider } from '../provider';

describe('DeveloperClient', () => {
  const networkName = 'net';
  const neoOneProvider = new NEOONEProvider([
    {
      network: networkName,
      rpcURL: 'rpc',
    },
  ]);
  const provider = neoOneProvider.read(networkName);
  const developerClient = new DeveloperClient(provider);

  test('runConsensusNow', async () => {
    // tslint:disable-next-line no-object-mutation
    provider.runConsensusNow = jest.fn();
    await developerClient.runConsensusNow();

    expect(provider.runConsensusNow).toHaveBeenCalledWith();
    expect(provider.runConsensusNow).toHaveBeenCalledTimes(1);
  });

  test('updateSettings', async () => {
    const options = { secondsPerBlock: 10 };
    // tslint:disable-next-line no-object-mutation
    provider.updateSettings = jest.fn();
    await developerClient.updateSettings(options);

    expect(provider.updateSettings).toHaveBeenCalledWith(options);
    expect(provider.updateSettings).toHaveBeenCalledTimes(1);
  });

  test('fastForwardOffset', async () => {
    const offset = 10;
    // tslint:disable-next-line no-object-mutation
    provider.fastForwardOffset = jest.fn();
    await developerClient.fastForwardOffset(offset);

    expect(provider.fastForwardOffset).toHaveBeenCalledWith(offset);
    expect(provider.fastForwardOffset).toHaveBeenCalledTimes(1);
  });

  test('fastForwardOffset', async () => {
    const time = 10;
    // tslint:disable-next-line no-object-mutation
    provider.fastForwardToTime = jest.fn();
    await developerClient.fastForwardToTime(time);

    expect(provider.fastForwardOffset).toHaveBeenCalledWith(time);
    expect(provider.fastForwardOffset).toHaveBeenCalledTimes(1);
  });
});
