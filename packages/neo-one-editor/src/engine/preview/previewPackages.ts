import * as react from '@neo-one/react';
import * as reactCommon from '@neo-one/react-common';
import { PackageConfig } from '../remote/packages';

export const previewPackages: ReadonlyArray<PackageConfig> = [
  {
    name: '@neo-one/react',
    path: '/node_modules/@neo-one/react/src/index.ts',
    exports: () => react,
  },
  {
    name: '@neo-one/react-common',
    path: '/node_modules/@neo-one/react-common/src/index.ts',
    exports: () => reactCommon,
  },
];
