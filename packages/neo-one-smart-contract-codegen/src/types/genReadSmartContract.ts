import { ABI } from '@neo-one/client-core';
import _ from 'lodash';
import { genConstantFunction } from './genConstantFunction';
import { getEventName } from './getEventName';
import { getReadSmartContractName } from './getReadSmartContractName';

export const genReadSmartContract = (name: string, abi: ABI): string => `
export interface ${getReadSmartContractName(name)} extends ReadSmartContract<${getEventName(name)}> {
  ${_.sortBy(abi.functions, (func) => func.name)
    .filter((func) => func.constant)
    .map((func) => `readonly ${func.name}: ${genConstantFunction(func)}`)
    .join('\n  ')}
}
`;
