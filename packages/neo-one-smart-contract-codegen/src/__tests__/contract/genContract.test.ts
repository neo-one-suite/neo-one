import { genContract } from '../../contract';

describe('genContract', () => {
  test('Token', () => {
    expect(
      genContract({
        name: 'Token',
        createContractPath: '/foo/bar/one/generated/Token/contract.ts',
        typesPath: '/foo/bar/one/generated/Token/types.ts',
        abiPath: '/foo/bar/one/generated/Token/abi.ts',
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
