import { ABIFunction } from '@neo-one/client-core';
import { toTypeScriptType } from '../utils';
import { genFunctionParameters } from './genFunctionParameters';
import { getEventName } from './getEventName';

const getFunctionReturnType = (name: string, abi: ABIFunction) => {
  if (abi.claim) {
    return `TransactionResult<TransactionReceipt, ClaimTransaction>`;
  }

  return `TransactionResult<InvokeReceipt<${toTypeScriptType(abi.returnType)}, ${getEventName(
    name,
  )}>, InvocationTransaction>`;
};

export const genFunction = (name: string, abi: ABIFunction): string =>
  `(${genFunctionParameters(abi)}) => Promise<${getFunctionReturnType(name, abi)}>;`;
