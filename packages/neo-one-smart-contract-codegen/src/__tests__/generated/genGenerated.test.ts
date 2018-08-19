import { contractsPaths } from '../../__data__/contractsPaths';
import { genGenerated } from '../../generated';

describe('genGenerated', () => {
  test('Token', () => {
    expect(
      genGenerated({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.js',
        reactPath: '/foo/bar/one/generated/react.jsx',
        clientPath: '/foo/bar/one/generated/client.js',
        generatedPath: '/foo/bar/one/generated/index.js',
      }),
    ).toMatchSnapshot();
  });
});
