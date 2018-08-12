import { genTest } from '../../test';

describe('genTest', () => {
  test('Token', () => {
    expect(
      genTest({
        name: 'Token',
        contractPath: '/foo/bar/one/contracts/Token.ts',
        typesPath: '/foo/bar/one/generated/Token/types.ts',
        testPath: '/foo/bar/one/generated/Token/setupTest.ts',
      }),
    ).toMatchSnapshot();
  });
});
