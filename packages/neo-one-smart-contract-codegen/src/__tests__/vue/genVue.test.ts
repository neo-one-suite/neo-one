import { contractsPaths } from '../../__data__/contractsPaths';
import { genVue } from '../../vue';

describe('genVue', () => {
  test('Token', () => {
    expect(
      genVue({
        contractsPaths,
        commonTypesPath: '/foo/bar/one/generated/types.js',
        vuePath: '/foo/bar/one/generated/vue.js',
        clientPath: '/foo/bar/one/generated/client.js',
      }),
    ).toMatchSnapshot();
  });
});
