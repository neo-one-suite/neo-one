import { contractsPaths } from '../../__data__/contractsPaths';
import { genContracts } from '../../contracts';

describe('genContracts', () => {
  test('Token', () => {
    expect(
      genContracts({
        contractsPaths,
        contractsPath: '/foo/bar/one/generated/contracts.js',
      }),
    ).toMatchSnapshot();
  });
});
