import { createWithContracts } from '@neo-one/smart-contract-test-browser';
import { PackageConfig } from '../remote/packages';

export const testPackages: ReadonlyArray<PackageConfig> = [
  {
    name: '@neo-one/smart-contract-test-browser',
    path: '/node_modules/@neo-one/smart-contract-test-browser/src/index.ts',
    exports: ({ fs }) => ({
      withContracts: createWithContracts(() => fs),
    }),
  },
];
