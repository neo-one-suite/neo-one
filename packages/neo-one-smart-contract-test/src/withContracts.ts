import { NEOONEDataProvider, SmartContractAny } from '@neo-one/client-core';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import {
  Contract,
  TestOptions,
  withContracts as withContractsBase,
  WithContractsOptions,
} from '@neo-one/smart-contract-test-common';
import { createNode } from './createNode';

export { Contract, WithContractsOptions, TestOptions };

// tslint:disable-next-line no-any
export const getContractFromOptions = (options: any, smartContractName: string): SmartContractAny => {
  const smartContract: SmartContractAny = options[smartContractName];

  // tslint:disable-next-line: strict-type-predicates
  if (smartContract === undefined) {
    const re = new RegExp(smartContractName.toLowerCase(), 'g');
    const matches = Object.keys(options).filter((key) => key.toLowerCase().match(re));
    if (matches.length) {
      // tslint:disable-next-line: no-console
      console.error(
        `\n\nCould not find smartContractName: "${smartContractName}", did you mean: ${matches.join(', ')}\n\n`,
      );
    } else {
      const reserved = [
        'client',
        'developerClient',
        'masterAccountID',
        'masterPrivateKey',
        'networkName',
        'accountIDs',
      ];
      const otherNames = Object.keys(options).filter((key) => reserved.indexOf(key) === -1);
      // tslint:disable-next-line: no-console
      console.error(
        `\n\nCould not find smartContractName: "${smartContractName}", did you mean: ${otherNames.join(', ')}\n\n`,
      );
    }
  }

  return smartContract;
};

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
