import { ABIFunction } from '@neo-one/client-core';
import { toTypeScriptType } from '../utils';
import { genFunctionParameters } from './genFunctionParameters';
import { getEventName } from './getEventName';

export const genFunction = (name: string, abi: ABIFunction): string =>
  `(${genFunctionParameters(abi)}) => Promise<TransactionResult<InvokeReceipt<${toTypeScriptType(
    abi.returnType,
  )}, ${getEventName(name)}>>>;`;
