import { contractsPaths } from '../__data__/contractsPaths';
import { genCommonFiles } from '../genCommonFiles';

describe('genCommonFiles', () => {
  test('Token', () => {
    expect(
      genCommonFiles({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.ts',
        testPath: '/foo/bar/one/generated/test.ts',
        reactPath: '/foo/bar/one/generated/react.ts',
      }),
    ).toMatchSnapshot();
  });
});
