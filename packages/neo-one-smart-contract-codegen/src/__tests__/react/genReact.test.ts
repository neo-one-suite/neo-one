import { contractsPaths } from '../../__data__/contractsPaths';
import { genReact } from '../../react';

describe('genReact', () => {
  test('Token', () => {
    expect(
      genReact({
        contractsPaths,
        contractsPath: '/foo/bar/one/generated/contracts.js',
        reactPath: '/foo/bar/one/generated/react.js',
        clientPath: '/foo/bar/one/generated/client.js',
      }),
    ).toMatchSnapshot();
  });
});
