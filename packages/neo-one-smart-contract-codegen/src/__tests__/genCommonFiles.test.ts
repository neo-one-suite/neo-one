import { contractsPaths } from '../__data__/contractsPaths';
import { genCommonFiles } from '../genCommonFiles';

describe('genCommonFiles', () => {
  test('Token', () => {
    expect(
      genCommonFiles({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.ts',
        testPath: '/foo/bar/one/generated/test.ts',
        reactPath: '/foo/bar/one/generated/react.tsx',
        clientPath: '/foo/bar/one/generated/client.ts',
        generatedPath: '/foo/bar/one/generated/index.ts',
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
