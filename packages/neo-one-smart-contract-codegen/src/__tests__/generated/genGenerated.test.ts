import { contractsPaths } from '../../__data__/contractsPaths';
import { genGenerated } from '../../generated';

describe('genGenerated', () => {
  test('Token', () => {
    expect(
      genGenerated({
        contractsPaths,
        contractsPath: '/foo/bar/one/generated/contracts.js',
        reactPath: '/foo/bar/one/generated/react.jsx',
        angularPath: '/foo/bar/one/generated/angular.service.js',
        vuePath: '/foo/bar/one/generated/vue.js',
        clientPath: '/foo/bar/one/generated/client.js',
        generatedPath: '/foo/bar/one/generated/index.js',
        framework: 'angular',
      }),
    ).toMatchSnapshot();
  });
});
