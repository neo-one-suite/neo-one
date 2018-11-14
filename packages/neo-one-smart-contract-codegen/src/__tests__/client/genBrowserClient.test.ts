import { genBrowserClient } from '../../client';

describe('genBrowserClient', () => {
  test('Token', () => {
    expect(
      genBrowserClient({
        localDevNetworkName: 'local',
        wallets: [
          {
            name: 'master',
            privateKey: 'L4qhHtwbiAMu1nrSmsTP5a3dJbxA3SNS6oheKnKd8E7KTJyCLcUv',
          },
        ],
        networks: [
          {
            name: 'priv',
            rpcURL: 'http://localhost:4500/rpc',
            dev: true,
          },
        ],
      }),
    ).toMatchSnapshot();
  });
});
