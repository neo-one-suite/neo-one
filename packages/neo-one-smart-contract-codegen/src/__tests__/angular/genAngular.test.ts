import { contractsPaths } from '../../__data__/contractsPaths';
import { genAngular } from '../../angular';

describe('genAngular', () => {
  test('Token', () => {
    expect(
      genAngular({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.js',
        angularPath: '/foo/bar/one/generated/angular.service.js',
        clientPath: '/foo/bar/one/generated/client.js',
      }),
    ).toMatchSnapshot();
  });
});
