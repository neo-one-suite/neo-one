import { ContractPaths } from '../type';

const sourceMap = {
  version: 0,
  sources: [],
  names: [],
  mappings: 'sourcemap',
  file: 'file',
};

export const contractsPaths: ReadonlyArray<ContractPaths> = [
  {
    name: 'Token',
    contractPath: '/foo/bar/one/contracts/Token.ts',
    typesPath: '/foo/bar/one/generated/Token/types.js',
    createContractPath: '/foo/bar/one/generated/Token/contract.js',
    manifestPath: '/foo/bar/one/generated/Token/manifest.js',
    sourceMap,
  },
  {
    name: 'ICO',
    contractPath: '/foo/bar/one/contracts/ICO.ts',
    typesPath: '/foo/bar/one/generated/ICO/types.js',
    createContractPath: '/foo/bar/one/generated/ICO/contract.js',
    manifestPath: '/foo/bar/one/generated/ICO/manifest.js',
    sourceMap,
  },
];
