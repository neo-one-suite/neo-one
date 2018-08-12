import { abi } from '@neo-one/client';
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
        abi: abi.NEP5_STATIC(4),
        networksDefinition: {
          main: {
            hash: 'iamahash',
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
