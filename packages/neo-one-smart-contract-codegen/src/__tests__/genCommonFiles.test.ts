import { contractsPaths } from '../__data__/contractsPaths';
import { genCommonFiles } from '../genCommonFiles';

describe('genCommonFiles', () => {
  test('Token', () => {
    expect(
      genCommonFiles({
        contractsPaths,
        contractsPath: '/foo/bar/one/generated/contracts.js',
        testPath: '/foo/bar/one/generated/test.js',
        reactPath: '/foo/bar/one/generated/react.jsx',
        angularPath: '/foo/bar/one/generated/angular.service.js',
        vuePath: '/foo/bar/one/generated/vue.js',
        clientPath: '/foo/bar/one/generated/client.js',
        generatedPath: '/foo/bar/one/generated/index.js',
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
        sourceMapsPath: '/foo/bar/one/generated/sourceMaps.js',
        sourceMaps: {},
        framework: 'vue',
        browserify: false,
      }),
    ).toMatchSnapshot();
  });
});
