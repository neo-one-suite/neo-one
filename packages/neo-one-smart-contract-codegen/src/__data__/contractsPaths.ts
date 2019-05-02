import { ContractPaths } from '../type';

const sourceMap = {
  version: 0,
  sources: [],
  names: [],
  mappings: 'sourcemap',
  file: 'file',
};

export const contractsPaths: readonly ContractPaths[] = [
  {
    name: 'Token',
    contractPath: '/foo/bar/one/contracts/Token.ts',
    typesPath: '/foo/bar/one/generated/Token/types.js',
    createContractPath: '/foo/bar/one/generated/Token/contract.js',
    abiPath: '/foo/bar/one/generated/Token/abi.js',
    addresses: ['AV6PhAq1FHBeCMsNUPMWzpUFxvXRFwHoLn'],
    sourceMap,
  },
  {
    name: 'ICO',
    contractPath: '/foo/bar/one/contracts/ICO.ts',
    typesPath: '/foo/bar/one/generated/ICO/types.js',
    createContractPath: '/foo/bar/one/generated/ICO/contract.js',
    abiPath: '/foo/bar/one/generated/ICO/abi.js',
    addresses: ['ATfAohZQ5iuGDXWjcHxLAj8WXwQchGLXhi'],
    sourceMap,
  },
];
