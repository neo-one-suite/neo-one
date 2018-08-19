import { genContract } from '../../contract';

describe('genContract', () => {
  test('Token', () => {
    expect(
      genContract({
        name: 'Token',
        createContractPath: '/foo/bar/one/generated/Token/contract.ts',
        typesPath: '/foo/bar/one/generated/Token/types.ts',
        abiPath: '/foo/bar/one/generated/Token/abi.ts',
        sourceMapsPath: '/foo/bar/one/generated/sourceMaps.ts',
        networksDefinition: {
          main: {
            address: 'iamahash',
          },
        },
      }),
    ).toMatchSnapshot();
  });
});
