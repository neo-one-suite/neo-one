import { ABI, createForwardedValueFuncArgsName, createForwardedValueFuncReturnName } from '@neo-one/client-core';
import _ from 'lodash';
import { genConstantFunction } from './genConstantFunction';
import { genForwardArgsFunction } from './genForwardArgsFunction';
import { genForwardReturnFunction } from './genForwardReturnFunction';
import { genFunction } from './genFunction';
import { getReadSmartContractName } from './getReadSmartContractName';
import { getSmartContractName } from './getSmartContractName';

export const genSmartContract = (name: string, abi: ABI): string => `
export interface ${getSmartContractName(name)} extends SmartContract<${getReadSmartContractName(name)}> {
  ${_.flatMap(
    _.sortBy(abi.functions, (func) => func.name).map((func) => {
      const parameters = func.parameters === undefined ? [] : func.parameters;
      const forwardedParameters = parameters.filter((parameter) => parameter.forwardedValue);
      let decls = [`readonly ${func.name}: ${func.constant ? genConstantFunction(func) : genFunction(name, func)}`];
      if (forwardedParameters.length > 0) {
        decls = decls.concat([
          `readonly ${createForwardedValueFuncArgsName(func)}: ${genForwardArgsFunction(func, forwardedParameters)}`,
        ]);
      }

      if (func.returnType.forwardedValue) {
        decls = decls.concat([
          `readonly ${createForwardedValueFuncReturnName(func)}: ${genForwardReturnFunction(func)}`,
        ]);
      }

      return decls;
    }),
  ).join('\n  ')}
}
`;
