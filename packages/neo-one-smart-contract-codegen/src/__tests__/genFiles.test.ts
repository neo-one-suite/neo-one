import { nep5 } from '@neo-one/client';
import { genFiles } from '../genFiles';

describe('genFiles', () => {
  test('Token', () => {
    expect(
      genFiles({
        name: 'Token',
        contractPath: '/foo/bar/one/contracts/Token.ts',
        createContractPath: '/foo/bar/one/generated/Token/contract.ts',
        typesPath: '/foo/bar/one/generated/Token/types.ts',
        abiPath: '/foo/bar/one/generated/Token/abi.ts',
        testPath: '/foo/bar/one/generated/Token/setupTest.ts',
        abi: nep5.abi(4),
        networksDefinition: {
          main: {
            address: 'iamahash',
          },
        },
        sourceMap: {
          version: 0,
          sources: [],
          names: [],
          mappings: 'sourcemap',
          file: 'file',
        },
      }),
    ).toMatchSnapshot();
  });
});
