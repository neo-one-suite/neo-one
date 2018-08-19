import { nep5 } from '@neo-one/client';
import { genFiles } from '../genFiles';

describe('genFiles', () => {
  test.only('Token', () => {
    expect(
      genFiles({
        name: 'Token',
        contractPath: '/foo/bar/one/contracts/Token.ts',
        createContractPath: '/foo/bar/one/generated/Token/contract.ts',
        typesPath: '/foo/bar/one/generated/Token/types.ts',
        abiPath: '/foo/bar/one/generated/Token/abi.ts',
        sourceMapsPath: '/foo/bar/one/generated/sourceMaps.ts',
        abi: nep5.abi(4),
        networksDefinition: {
          main: {
            address: 'iamahash',
          },
        },
      }),
    ).toMatchSnapshot();
  });
});
