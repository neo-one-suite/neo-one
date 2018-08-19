import { contractsPaths } from '../../__data__/contractsPaths';
import { genCommonTypes } from '../../commonTypes';

describe('genCommonTypes', () => {
  test('Token', () => {
    expect(
      genCommonTypes({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.ts',
      }),
    ).toMatchSnapshot();
  });
});
