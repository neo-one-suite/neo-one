import { genClient } from '../../client';

describe('genClient', () => {
  test('Token', () => {
    expect(
      genClient({
        localDevNetworkName: 'local',
        wallets: [
          {
            name: 'master',
            privateKey: 'L4qhHtwbiAMu1nrSmsTP5a3dJbxA3SNS6oheKnKd8E7KTJyCLcUv',
          },
        ],
        networks: [
          {
            name: 'local',
            rpcURL: 'http://localhost:4500/rpc',
            dev: true,
          },
        ],
        projectIDPath: '/foo/bar/one/generated/projectID.js',
        clientPath: '/foo/bar/one/generated/client.js',
        httpServerPort: 40100,
        browser: false,
      }),
    ).toMatchSnapshot();
  });
});
