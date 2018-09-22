import { ABIFunction } from '@neo-one/client-common';
import { toTypeScriptType } from '../utils';
import { genFunctionParameters } from './genFunctionParameters';
import { getEventName } from './getEventName';

const getFunctionReturnReceipt = (name: string, abi: ABIFunction) => {
  if (abi.claim) {
    return 'TransactionReceipt';
  }

  return `InvokeReceipt<${toTypeScriptType(abi.returnType, { isParameter: false })}, ${getEventName(name)}>`;
};

const getFunctionReturnTransaction = (abi: ABIFunction) => (abi.claim ? 'ClaimTransaction' : 'InvocationTransaction');

const getFunctionReturnType = (name: string, abi: ABIFunction) =>
  `TransactionResult<${getFunctionReturnReceipt(name, abi)}, ${getFunctionReturnTransaction(abi)}>`;

const getFunctionType = (name: string, abi: ABIFunction) =>
  genFunctionParameters(abi)
    .map((params) => `(${params}): Promise<${getFunctionReturnType(name, abi)}>;`)
    .join('  \n');
const getConfirmedType = (name: string, abi: ABIFunction) =>
  genFunctionParameters(abi, abi.parameters, {
    withConfirmedOptions: true,
  })
    .map(
      (params) =>
        `(${params}): Promise<${getFunctionReturnReceipt(
          name,
          abi,
        )} & { readonly transaction: ${getFunctionReturnTransaction(abi)}}>;`,
    )
    .join('    \n');

export const genFunction = (name: string, abi: ABIFunction): string => `{
  ${getFunctionType(name, abi)}
  readonly confirmed: {
    ${getConfirmedType(name, abi)}
  },
}`;
