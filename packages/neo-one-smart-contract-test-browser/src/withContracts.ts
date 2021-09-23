import { NEOONEDataProvider } from '@neo-one/client-core';
import { createCompilerHost, FileSystem } from '@neo-one/local-browser';
import { createJSONRPCLocalProviderManager, getFileSystem } from '@neo-one/local-singleton';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import {
  Contract,
  TestOptions,
  withContracts as withContractsBase,
  WithContractsOptions,
} from '@neo-one/smart-contract-test-common';
import { constants } from '@neo-one/utils';
import { WorkerManager } from '@neo-one/worker';

export { TestOptions, WithContractsOptions, Contract };

export const createWithContractsBase =
  (getFS: () => FileSystem, createManager: () => Promise<WorkerManager<typeof JSONRPCLocalProvider>>) =>
  async <T>(
    contracts: ReadonlyArray<Contract>,
    test: (contracts: T & TestOptions) => Promise<void>,
    options?: WithContractsOptions,
  ): Promise<void> =>
    withContractsBase(
      contracts,
      test,
      () => createCompilerHost({ fs: getFS() }),
      async () => {
        const manager = await createManager();
        const dataProvider = new NEOONEDataProvider({ network: 'priv', rpcURL: manager });

        return {
          dataProvider,
          privateKey: constants.PRIVATE_NET_PRIVATE_KEY,
          cleanup: async () => {
            manager.dispose();
          },
        };
      },
      options,
    );

export const withContracts = createWithContractsBase(getFileSystem, createJSONRPCLocalProviderManager);
