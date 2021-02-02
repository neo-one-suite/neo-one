import { nep17 } from '../__data__';
import { genFiles } from '../genFiles';

describe('genFiles', () => {
  test('Token', () => {
    expect(
      genFiles({
        name: 'Token',
        contractPath: '/foo/bar/one/contracts/Token.ts',
        createContractPath: '/foo/bar/one/generated/Token/contract.js',
        typesPath: '/foo/bar/one/generated/Token/types.js',
        manifestPath: '/foo/bar/one/generated/Token/manifest.js',
        sourceMapsPath: '/foo/bar/one/generated/sourceMaps.js',
        manifest: nep17.manifest(4),
        networksDefinition: {
          main: {
            address: 'iamahash',
          },
        },
        browserify: false,
      }),
    ).toMatchSnapshot();
  });
});
