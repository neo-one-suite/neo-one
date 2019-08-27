// tslint:disable promise-function-async no-any no-loop-statement
import { SourceMaps } from '@neo-one/client-common';
import { getParamAndOptionsResults, SmartContractAny } from '@neo-one/client-core';
import { Client } from '@neo-one/client-full-core';
import { CompileContractResult } from '@neo-one/smart-contract-compiler';
import { camel } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { createDeferred } from './createDeferred';
import { Action, Migration, Print } from './types';

interface NameToContract {
  readonly [name: string]: CompileContractResult;
}

interface Contracts {
  readonly [name: string]: SmartContractAny;
}

export const runMigration = async (
  migration: Migration,
  contractResults: readonly CompileContractResult[],
  sourceMaps: SourceMaps,
  client: Client,
  network: string,
  print: Print,
) => {
  const nameToContract: NameToContract = _.fromPairs(
    contractResults.map((contract) => [camel(contract.contract.name), contract]),
  );
  let contracts: Contracts = _.fromPairs(
    Object.entries(nameToContract).map(([name, contract]) => [
      name,
      client.smartContract({ abi: contract.abi, networks: {} }),
    ]),
  );

  let mutableActions: Action[] = [];
  const migrationContracts = _.fromPairs(
    Object.entries(nameToContract).map(([name, contract]) => [
      name,
      _.fromPairs(
        contract.abi.functions.map((func) => [
          func.name,
          (...args: any[]) => {
            const { requiredArgs, forwardOptions, options, transfer, hash } = getParamAndOptionsResults({
              parameters: func.parameters === undefined ? [] : func.parameters,
              args,
              send: !!func.send,
              completeSend: !!func.completeSend,
              refundAssets: !!func.refundAssets,
            });

            const deferred = createDeferred();
            mutableActions.push({
              contract: name,
              method: func.name,
              params: requiredArgs,
              forwardOptions,
              options,
              transfer,
              hash,
              deferred,
              args,
            });

            return deferred.promise;
          },
        ]),
      ),
    ]),
  );

  const execute = async () => {
    const currentActions = mutableActions;
    mutableActions = [];
    for (const action of currentActions) {
      print('Executing action:');
      print(JSON.stringify(action, undefined, 2));
      try {
        if (action.method === 'deploy') {
          const contract = nameToContract[action.contract];
          const params = await Promise.all(action.params);
          const result = await client.publishAndDeploy(
            contract.contract,
            contract.abi,
            params,
            {
              ...(action.options === undefined ? {} : action.options),
              systemFee: new BigNumber(1000),
            },
            sourceMaps,
          );
          const receipt = await result.confirmed();
          if (receipt.result.state !== 'HALT') {
            throw new Error(receipt.result.message);
          }

          print(`Deployed ${action.contract} at ${receipt.result.value.address}`);

          contracts = {
            ...contracts,
            [action.contract]: client.smartContract({
              abi: contract.abi,
              networks: {
                [network]: {
                  address: receipt.result.value.address,
                },
              },
            }),
          };

          action.deferred.resolve(receipt);
        } else {
          const args = await Promise.all(action.args);
          const receipt = await contracts[action.contract][action.method](...args);
          if (receipt.result.state !== 'HALT') {
            throw new Error(receipt.result.message);
          }

          action.deferred.resolve(receipt);
        }
      } catch (err) {
        action.deferred.reject(err);
        throw err;
      }
    }
  };

  migration(
    // tslint:disable-next-line no-any
    migrationContracts as any,
    network,
    client
      .getUserAccounts()
      .map(({ id }) => id)
      .filter((id) => id.network === network),
  );

  await execute();
};
