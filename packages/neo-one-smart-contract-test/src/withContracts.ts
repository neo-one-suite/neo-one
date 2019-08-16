import { NEOONEDataProvider } from '@neo-one/client-core';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import {
  Contract,
  TestOptions,
  withContracts as withContractsBase,
  WithContractsOptions,
} from '@neo-one/smart-contract-test-common';
import { createNode } from './createNode';

export { Contract, WithContractsOptions, TestOptions };

export const withContracts = async <T>(
  contracts: ReadonlyArray<Contract>,
  test: (contracts: T & TestOptions) => Promise<void>,
  options?: WithContractsOptions,
): Promise<void> =>
  withContractsBase(
    contracts,
    test,
    createCompilerHost,
    async () => {
      const { privateKey, rpcURL, node } = await createNode();
      const dataProvider = new NEOONEDataProvider({ network: 'priv', rpcURL });

      return {
        dataProvider,
        privateKey,
        cleanup: async () => {
          await node.stop();
        },
      };
    },
    options,
  );
