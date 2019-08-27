import { contractsPaths } from '../../__data__/contractsPaths';
import { genTest } from '../../test';

describe('genTest', () => {
  test('Token', () => {
    expect(
      genTest({
        contractsPaths,
        contractsPath: '/foo/bar/one/generated/contracts.js',
        testPath: '/foo/bar/one/generated/test.js',
      }),
    ).toMatchSnapshot();
  });
});
