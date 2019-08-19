import { contractsPaths } from '../../__data__/contractsPaths';
import { genReact } from '../../react';

describe('genReact', () => {
  test('Token', () => {
    expect(
      genReact({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.js',
        reactPath: '/foo/bar/one/generated/react.js',
        clientPath: '/foo/bar/one/generated/client.js',
      }),
    ).toMatchSnapshot();
  });
});
