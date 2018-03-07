/* @flow */
import DeveloperClient from '../DeveloperClient';
import NEOONEDataProvider from '../provider/neoone/NEOONEDataProvider';

describe('DeveloperClient', () => {
  const developerClient = new DeveloperClient(
    new NEOONEDataProvider({
      network: 'net',
      rpcURL: 'rpc',
    }),
  );

  test('startConsensusNow', () => {
    // $FlowFixMe
    developerClient.developerProvider.startConsensusNow = jest.fn();
    const result = developerClient.startConsensusNow();

    expect(result).toBeUndefined();
    expect(result).toMatchSnapshot();
  });
});
