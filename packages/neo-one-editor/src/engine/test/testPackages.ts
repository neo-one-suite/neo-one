import { createWithContractsBase } from '@neo-one/smart-contract-test-browser';
import { PackageConfig } from '../remote/packages';

export const testPackages: readonly PackageConfig[] = [
  {
    name: '@neo-one/smart-contract-test-browser',
    path: '/node_modules/@neo-one/smart-contract-test-browser/src/index.ts',
    exports: ({ fs, createJSONRPCLocalProviderManager }) => ({
      withContracts: createWithContractsBase(() => fs, createJSONRPCLocalProviderManager),
    }),
  },
];
