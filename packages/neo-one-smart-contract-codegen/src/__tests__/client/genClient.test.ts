import { genClient } from '../../client';

describe('genClient', () => {
  test('Token', () => {
    expect(
      genClient({
        localDevNetworkName: 'local',
        wallets: [
          {
            name: 'master',
            wif: 'L4qhHtwbiAMu1nrSmsTP5a3dJbxA3SNS6oheKnKd8E7KTJyCLcUv',
          },
        ],
        networks: [
          {
            name: 'local',
            rpcURL: 'http://localhost:4500/rpc',
            dev: true,
          },
        ],
        localDevNetworkPort: 40100,
      }),
    ).toMatchSnapshot();
  });
});
