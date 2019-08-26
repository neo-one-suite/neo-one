import { ABIFunction } from '@neo-one/client-common';
import { toTypeScriptType } from '../utils';
import { genFunctionParameters } from './genFunctionParameters';

export interface GenConstantFunctionOptions {
  readonly migration?: boolean;
}

export const genConstantFunction = (abi: ABIFunction, options: GenConstantFunctionOptions): string => {
  const paramss = genFunctionParameters(abi, undefined, options);
  if (paramss.length === 1) {
    return `(${paramss[0]}) => Promise<${toTypeScriptType(abi.returnType, { isParameter: false })}>;`;
  }

  return `{
  ${paramss
    .map((params) => `(${params}): Promise<${toTypeScriptType(abi.returnType, { isParameter: false })}>;`)
    .join('  \n')}
}`;
};
