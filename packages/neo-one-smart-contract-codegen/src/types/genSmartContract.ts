import { ABI } from '@neo-one/client-core';
import _ from 'lodash';
import { genConstantFunction } from './genConstantFunction';
import { genFunction } from './genFunction';
import { getReadSmartContractName } from './getReadSmartContractName';
import { getSmartContractName } from './getSmartContractName';

export const genSmartContract = (name: string, abi: ABI): string => `
export interface ${getSmartContractName(name)} extends SmartContract<${getReadSmartContractName(name)}> {
  ${_.sortBy(abi.functions, (func) => func.name)
    .map((func) => `readonly ${func.name}: ${func.constant ? genConstantFunction(func) : genFunction(name, func)}`)
    .join('\n  ')}
}
`;
