import * as client from '@neo-one/client';
import * as clientFull from '@neo-one/client-full';
import { BrowserLocalClient, Builder, FileSystem } from '@neo-one/local-browser';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import * as react from '@neo-one/react';
import { createWithContracts } from '@neo-one/smart-contract-test-browser';
import { Exports } from './types';

export interface ExportsOptions {
  readonly fs: FileSystem;
  readonly jsonRPCLocalProvider: JSONRPCLocalProvider;
  readonly builder: Builder;
}

export interface PackageConfig {
  readonly name: string;
  readonly path: string;
  readonly exports: (options: ExportsOptions) => Exports;
}

export const packages: ReadonlyArray<PackageConfig> = [
  {
    name: '@neo-one/client',
    path: '/node_modules/@neo-one/client/src/index.ts',
    exports: () => client,
  },
  {
    name: '@neo-one/client-full',
    path: '/node_modules/@neo-one/client-full/src/index.ts',
    exports: () => clientFull,
  },
  {
    name: '@neo-one/react',
    path: '/node_modules/@neo-one/react/src/index.ts',
    exports: () => react,
  },
  {
    name: '@neo-one/smart-contract-test-browser',
    path: '/node_modules/@neo-one/smart-contract-test-browser/src/index.ts',
    exports: ({ fs }) => ({
      withContracts: createWithContracts(() => fs),
    }),
  },
  {
    name: '@neo-one/local-singleton',
    path: '/node_modules/@neo-one/local-singleton/src/index.ts',
    exports: ({ fs, jsonRPCLocalProvider, builder }) => {
      const browserLocalClient = new BrowserLocalClient(builder, jsonRPCLocalProvider);

      return {
        getFileSystem: () => fs,
        getJSONRPCLocalProvider: () => jsonRPCLocalProvider,
        getBrowserLocalClient: () => browserLocalClient,
      };
    },
  },
];
