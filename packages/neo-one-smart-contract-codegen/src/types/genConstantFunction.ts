import { ABIFunction } from '@neo-one/client-core';
import { toTypeScriptType } from '../utils';
import { genFunctionParameters } from './genFunctionParameters';

export const genConstantFunction = (abi: ABIFunction): string => {
  const paramss = genFunctionParameters(abi);
  if (paramss.length === 1) {
    return `(${paramss[0]}) => Promise<${toTypeScriptType(abi.returnType, { isParameter: false })}>;`;
  }

  return `{
  ${paramss
    .map((params) => `(${params}): Promise<${toTypeScriptType(abi.returnType, { isParameter: false })}>;`)
    .join('  \n')}
}`;
};
