// tslint:disable promise-function-async no-any no-loop-statement
import { Configuration } from '@neo-one/cli-common';
import { SourceMaps } from '@neo-one/client-common';
import { getParamAndOptionsResults, SmartContractAny } from '@neo-one/client-core';
import { Client } from '@neo-one/client-full-core';
import { CompileContractResult } from '@neo-one/smart-contract-compiler';
import { camel } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import prompts from 'prompts';
import { Deployed, Print, saveDeployed } from '../common';
import { getActionResult, saveInvokeReceipt, savePublishReceipt } from './actionResult';
import { createDeferred } from './createDeferred';
import { printAction } from './printAction';
import { Action, Migration } from './types';

interface NameToContract {
  readonly [name: string]: CompileContractResult;
}

interface Contracts {
  readonly [name: string]: SmartContractAny;
}

export const runMigration = async (
  config: Configuration,
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

  const filterExecutedActions = async (actions: readonly Action[]) => {
    const actionAndExecuted = await Promise.all(
      actions.map(async (action) => {
        const result = await getActionResult(config, network, action);

        if (result !== undefined) {
          action.deferred.resolve(result);
        }

        return { action, executed: result !== undefined };
      }),
    );

    return actionAndExecuted.filter(({ executed }) => !executed).map(({ action }) => action);
  };

  let deployed: Deployed = {};
  const execute = async () => {
    let currentActions = mutableActions;
    mutableActions = [];

    print('Calculating actions to execute.');
    currentActions = await filterExecutedActions(currentActions);

    if (currentActions.length > 0) {
      print('Will execute:');
      currentActions.forEach((action) => printAction(action, print));

      const { confirmed } = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: 'Proceed with execution?',
      });

      if (!confirmed) {
        throw new Error('User cancelled execution');
      }
    }

    for (const action of currentActions) {
      print('Executing action:');
      printAction(action, print);
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
              networkFee: new BigNumber(1),
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

          deployed = {
            ...deployed,
            [action.contract]: {
              [network]: {
                address: receipt.result.value.address,
              },
            },
          };

          await Promise.all([saveDeployed(config, deployed), savePublishReceipt(config, network, action, receipt)]);
          action.deferred.resolve(receipt);
        } else {
          const args = await Promise.all(action.args);
          const receipt = await contracts[action.contract][action.method](...args);
          if (receipt.result.state !== 'HALT') {
            throw new Error(receipt.result.message);
          }

          await saveInvokeReceipt(config, network, action, receipt);
          action.deferred.resolve(receipt);
        }
      } catch (err) {
        action.deferred.reject(err);
        throw err;
      }
    }

    if (mutableActions.length > 0) {
      await execute();
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
