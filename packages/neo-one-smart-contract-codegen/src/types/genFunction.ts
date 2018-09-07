import { ABIFunction } from '@neo-one/client-core';
import { toTypeScriptType } from '../utils';
import { genFunctionParameters } from './genFunctionParameters';
import { getEventName } from './getEventName';

const getFunctionReturnReceipt = (name: string, abi: ABIFunction) => {
  if (abi.claim) {
    return 'TransactionReceipt';
  }

  return `InvokeReceipt<${toTypeScriptType(abi.returnType)}, ${getEventName(name)}>`;
};

const getFunctionReturnTransaction = (abi: ABIFunction) => (abi.claim ? 'ClaimTransaction' : 'InvocationTransaction');

const getFunctionReturnType = (name: string, abi: ABIFunction) =>
  `TransactionResult<${getFunctionReturnReceipt(name, abi)}, ${getFunctionReturnTransaction(abi)}>`;

const getFunctionType = (name: string, abi: ABIFunction) =>
  `(${genFunctionParameters(abi)}): Promise<${getFunctionReturnType(name, abi)}>;`;
const getConfirmedType = (name: string, abi: ABIFunction) =>
  `readonly confirmed: (${genFunctionParameters(abi, {
    withConfirmedOptions: true,
  })}) => Promise<${getFunctionReturnReceipt(name, abi)} & { readonly transaction: ${getFunctionReturnTransaction(
    abi,
  )}}>;`;

export const genFunction = (name: string, abi: ABIFunction): string => `{
  ${getFunctionType(name, abi)}
  ${getConfirmedType(name, abi)}
}`;
