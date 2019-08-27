import { contractsPaths } from '../../__data__/contractsPaths';
import { genAngular } from '../../angular';

describe('genAngular', () => {
  test('Token', () => {
    expect(
      genAngular({
        contractsPaths,
        contractsPath: '/foo/bar/one/generated/contracts.js',
        angularPath: '/foo/bar/one/generated/angular.service.js',
        clientPath: '/foo/bar/one/generated/client.js',
      }),
    ).toMatchSnapshot();
  });
});
