import * as client from '@neo-one/client';
import * as developerTools from '@neo-one/developer-tools';
import { BrowserLocalClient, Builder, FileSystem } from '@neo-one/local-browser';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import * as react from '@neo-one/react';
import * as reactCommon from '@neo-one/react-common';
import { WorkerManager } from '@neo-one/worker';
import { Exports } from './types';

export interface ExportsOptions {
  readonly fs: FileSystem;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  readonly builderManager: WorkerManager<typeof Builder>;
  readonly createJSONRPCLocalProviderManager: () => Promise<WorkerManager<typeof JSONRPCLocalProvider>>;
}

export interface PackageConfig {
  readonly name: string;
  readonly path: string;
  readonly exports: (options: ExportsOptions) => Exports;
}

const packages: ReadonlyArray<PackageConfig> = [
  {
    name: '@neo-one/client',
    path: '/node_modules/@neo-one/client/src/index.ts',
    exports: () => client,
  },
  {
    name: '@neo-one/developer-tools',
    path: '/node_modules/@neo-one/developer-tools/src/index.ts',
    exports: () => developerTools,
  },
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
  {
    name: '@neo-one/local-singleton',
    path: '/node_modules/@neo-one/local-singleton/src/index.ts',
    exports: ({ fs, jsonRPCLocalProviderManager, builderManager, createJSONRPCLocalProviderManager }) => {
      const browserLocalClient = new BrowserLocalClient(builderManager, jsonRPCLocalProviderManager);

      return {
        getFileSystem: () => fs,
        getJSONRPCLocalProviderManager: () => jsonRPCLocalProviderManager,
        getBrowserLocalClient: () => browserLocalClient,
        createJSONRPCLocalProviderManager,
      };
    },
  },
];

export interface PathWithExports {
  readonly name: string;
  readonly path: string;
  readonly exports: Exports;
}

export const getPathWithExports = (options: ExportsOptions, packagesIn = packages) =>
  packagesIn.reduce<ReadonlyArray<PathWithExports>>(
    (acc, { name, path, exports }) =>
      acc.concat({
        name,
        path,
        exports: exports(options),
      }),
    [],
  );
