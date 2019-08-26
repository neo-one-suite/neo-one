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

const getFunctionType = (name: string, abi: ABIFunction, migration = false) =>
  genFunctionParameters(abi, abi.parameters, {
    migration,
  })
    .map((params) => `${getForwardType(abi)}(${params}): Promise<${getFunctionReturnType(name, abi)}>;`)
    .join('  \n');
const getConfirmedType = (name: string, abi: ABIFunction, migration = false) =>
  genFunctionParameters(abi, abi.parameters, {
    withConfirmedOptions: true,
    migration,
  })
    .map(
      (params) =>
        `${getForwardType(abi)}(${params}): Promise<${getFunctionReturnReceipt(
          name,
          abi,
        )} & { readonly transaction: ${getFunctionReturnTransaction(abi)}}>;`,
    )
    .join('    \n');

export interface GenFunctionOptions {
  readonly migration?: boolean;
}

export const genFunction = (name: string, abi: ABIFunction, options: GenFunctionOptions): string => `{
  ${getFunctionType(name, abi, options.migration)}
  readonly confirmed: {
    ${getConfirmedType(name, abi, options.migration)}
  },
}`;
