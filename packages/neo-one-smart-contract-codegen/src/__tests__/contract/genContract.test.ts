import { genContract } from '../../contract';

describe('genContract', () => {
  test('Token', () => {
    expect(
      genContract({
        name: 'Token',
        createContractPath: '/foo/bar/one/generated/Token/contract.js',
        typesPath: '/foo/bar/one/generated/Token/types.js',
        abiPath: '/foo/bar/one/generated/Token/abi.js',
        sourceMapsPath: '/foo/bar/one/generated/sourceMaps.js',
        networksDefinition: {
          main: {
            address: 'iamahash',
          },
        },
        browser: false,
      }),
    ).toMatchSnapshot();
  });
});
