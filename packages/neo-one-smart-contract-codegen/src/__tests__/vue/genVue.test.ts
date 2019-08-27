import { contractsPaths } from '../../__data__/contractsPaths';
import { genVue } from '../../vue';

describe('genVue', () => {
  test('Token', () => {
    expect(
      genVue({
        contractsPaths,
        contractsPath: '/foo/bar/one/generated/contracts.js',
        vuePath: '/foo/bar/one/generated/vue.js',
        clientPath: '/foo/bar/one/generated/client.js',
      }),
    ).toMatchSnapshot();
  });
});
