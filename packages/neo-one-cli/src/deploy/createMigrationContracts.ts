// tslint:disable no-any promise-function-async
import { ABI } from '@neo-one/client-common';
import { getParamAndOptionsResults } from '@neo-one/client-core';
import _ from 'lodash';
import { createDeferred } from './createDeferred';
import { Action } from './types';

export interface ContractABIs {
  readonly [name: string]: ABI;
}

export const createMigrationContracts = (contractABIs: ContractABIs) => {
  const mutableActions: Action[] = [];
  const contracts = _.fromPairs(
    Object.entries(contractABIs).map(([name, abi]) => [
      name,
      _.fromPairs(
        abi.functions.map((func) => [
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
            });

            if (func.name !== 'deploy') {
              throw new Error('Migrations are currently only supported for the deploy method.');
            }

            return deferred.promise;
          },
        ]),
      ),
    ]),
  );

  return { actions: mutableActions, contracts };
};
