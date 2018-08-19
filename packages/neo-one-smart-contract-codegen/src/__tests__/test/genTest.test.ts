import { contractsPaths } from '../../__data__/contractsPaths';
import { genTest } from '../../test';

describe('genTest', () => {
  test('Token', () => {
    expect(
      genTest({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.js',
        testPath: '/foo/bar/one/generated/test.js',
      }),
    ).toMatchSnapshot();
  });
});
