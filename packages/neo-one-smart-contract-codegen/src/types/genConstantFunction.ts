import { ABIFunction } from '@neo-one/client-core';
import { toTypeScriptType } from '../utils';
import { genFunctionParameters } from './genFunctionParameters';

export const genConstantFunction = (abi: ABIFunction): string =>
  `(${genFunctionParameters(abi)}) => Promise<${toTypeScriptType(abi.returnType)}>;`;
