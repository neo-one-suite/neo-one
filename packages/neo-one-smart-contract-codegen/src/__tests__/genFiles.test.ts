import { nep5 } from '../__data__';
import { genFiles } from '../genFiles';

describe('genFiles', () => {
  test('Token', () => {
    expect(
      genFiles({
        name: 'Token',
        contractPath: '/foo/bar/one/contracts/Token.ts',
        createContractPath: '/foo/bar/one/generated/Token/contract.js',
        typesPath: '/foo/bar/one/generated/Token/types.js',
        abiPath: '/foo/bar/one/generated/Token/abi.js',
        sourceMapsPath: '/foo/bar/one/generated/sourceMaps.js',
        abi: nep5.abi(4),
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
