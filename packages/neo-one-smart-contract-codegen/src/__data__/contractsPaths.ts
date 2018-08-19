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
    typesPath: '/foo/bar/one/generated/Token/types.ts',
    addresses: ['AV6PhAq1FHBeCMsNUPMWzpUFxvXRFwHoLn'],
    sourceMap,
  },
  {
    name: 'ICO',
    contractPath: '/foo/bar/one/contracts/ICO.ts',
    typesPath: '/foo/bar/one/generated/ICO/types.ts',
    addresses: ['ATfAohZQ5iuGDXWjcHxLAj8WXwQchGLXhi'],
    sourceMap,
  },
];
