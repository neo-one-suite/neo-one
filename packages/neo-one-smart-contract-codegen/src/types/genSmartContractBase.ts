import { ContractManifestClient, ContractMethodDescriptorClient } from '@neo-one/client-common';
import { createForwardedValueFuncArgsName, createForwardedValueFuncReturnName } from '@neo-one/client-core';
import _ from 'lodash';
import { genConstantFunction } from './genConstantFunction';
import { genForwardArgsFunction } from './genForwardArgsFunction';
import { genForwardReturnFunction } from './genForwardReturnFunction';
import { genFunction } from './genFunction';
import { getEventName } from './getEventName';

export const genSmartContractBase = (
  name: string,
  interfaceName: string,
  manifest: ContractManifestClient,
  migration = false,
): string => {
  const extendsClause = `<TClient extends Client = Client> extends SmartContract<TClient, ${getEventName(name)}>`;

  return `
export interface ${interfaceName}${migration ? '' : extendsClause} {
  ${_.flatten(
    _.sortBy(manifest.abi.methods, [(func: ContractMethodDescriptorClient) => func.name]).map((func) => {
      const parameters = func.parameters === undefined ? [] : func.parameters;
      const forwardedParameters = parameters.filter((parameter) => parameter.forwardedValue);
      let decls = [
        `readonly ${func.name}: ${
          func.constant ? genConstantFunction(func, { migration }) : genFunction(name, func, { migration })
        }`,
      ];
      if (forwardedParameters.length > 0) {
        decls = decls.concat([
          `readonly ${createForwardedValueFuncArgsName(func)}: ${genForwardArgsFunction(
            name,
            func,
            forwardedParameters,
            { migration },
          )}`,
        ]);
      }

      if (func.returnType.forwardedValue) {
        decls = decls.concat([
          `readonly ${createForwardedValueFuncReturnName(func)}: ${genForwardReturnFunction(name, func)}`,
        ]);
      }

      return decls;
    }),
  ).join('\n  ')}
}
`;
};
