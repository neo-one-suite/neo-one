import { contractsPaths } from '../../__data__/contractsPaths';
import { genGenerated } from '../../generated';

describe('genGenerated', () => {
  test('Token', () => {
    expect(
      genGenerated({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.ts',
        reactPath: '/foo/bar/one/generated/react.tsx',
        clientPath: '/foo/bar/one/generated/client.ts',
        generatedPath: '/foo/bar/one/generated/index.ts',
      }),
    ).toMatchSnapshot();
  });
});
