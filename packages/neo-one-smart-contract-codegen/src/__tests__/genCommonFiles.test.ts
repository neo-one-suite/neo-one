import { contractsPaths } from '../__data__/contractsPaths';
import { genCommonFiles } from '../genCommonFiles';

describe('genCommonFiles', () => {
  test('Token', () => {
    expect(
      genCommonFiles({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.js',
        testPath: '/foo/bar/one/generated/test.js',
        reactPath: '/foo/bar/one/generated/react.jsx',
        clientPath: '/foo/bar/one/generated/client.js',
        generatedPath: '/foo/bar/one/generated/index.js',
        devNetworkName: 'local',
        masterPrivateKey: 'L4qhHtwbiAMu1nrSmsTP5a3dJbxA3SNS6oheKnKd8E7KTJyCLcUv',
        networks: [
          {
            name: 'local',
            rpcURL: 'http://localhost:4500/rpc',
          },
        ],
      }),
    ).toMatchSnapshot();
  });
});
