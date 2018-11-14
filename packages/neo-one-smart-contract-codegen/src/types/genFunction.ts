import { ABIFunction } from '@neo-one/client-common';
import { toTypeScriptType } from '../utils';
import { genFunctionParameters } from './genFunctionParameters';
import { getEventName } from './getEventName';
import { hasForward } from './hasForward';

const getFunctionReturnReceipt = (name: string, abi: ABIFunction) => {
  if (abi.claim) {
    return 'TransactionReceipt';
  }

  const eventName = getEventName(name);
  const event = hasForward(abi)
    ? `TForwardOptions extends ForwardOptions<infer T> ? ${eventName} | T : ${eventName}`
    : eventName;

  return `InvokeReceipt<${toTypeScriptType(abi.returnType, { isParameter: false })}, ${event}>`;
};

const getFunctionReturnTransaction = (abi: ABIFunction) => (abi.claim ? 'ClaimTransaction' : 'InvocationTransaction');

const getFunctionReturnType = (name: string, abi: ABIFunction) =>
  `TransactionResult<${getFunctionReturnReceipt(name, abi)}, ${getFunctionReturnTransaction(abi)}>`;

const getForwardType = (abi: ABIFunction) => (hasForward(abi) ? '<TForwardOptions extends ForwardOptions<any>>' : '');

const getFunctionType = (name: string, abi: ABIFunction) =>
  genFunctionParameters(abi)
    .map((params) => `${getForwardType(abi)}(${params}): Promise<${getFunctionReturnType(name, abi)}>;`)
    .join('  \n');
const getConfirmedType = (name: string, abi: ABIFunction) =>
  genFunctionParameters(abi, abi.parameters, {
    withConfirmedOptions: true,
  })
    .map(
      (params) =>
        `${getForwardType(abi)}(${params}): Promise<${getFunctionReturnReceipt(
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
