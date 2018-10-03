import { NEOONEDataProvider } from '@neo-one/client';
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
      const { privateKey, rpcURL, node } = await createNode(true);
      const dataProvider = new NEOONEDataProvider({ network: 'priv', rpcURL });

      return {
        dataProvider,
        privateKey,
        cleanup: async () => {
          // Give a chance for in-flight operations to complete before attempting to stop the node
          await new Promise<void>((resolve) =>
            setTimeout(async () => {
              await node.stop();
              resolve();
            }, 100),
          );
        },
      };
    },
    options,
  );
