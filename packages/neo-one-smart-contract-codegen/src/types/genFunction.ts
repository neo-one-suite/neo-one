import { ContractMethodDescriptorClient } from '@neo-one/client-common';
import { toTypeScriptType } from '../utils';
import { genFunctionParameters } from './genFunctionParameters';
import { getEventName } from './getEventName';
import { hasForward } from './hasForward';

const getFunctionReturnReceipt = (name: string, abi: ContractMethodDescriptorClient) => {
  const eventName = getEventName(name);
  const event = hasForward(abi)
    ? `TForwardOptions extends ForwardOptions<infer T> ? ${eventName} | T : ${eventName}`
    : eventName;

  return `InvokeReceipt<${toTypeScriptType(abi.returnType, { isParameter: false })}, ${event}>`;
};

const getFunctionReturnType = (name: string, abi: ContractMethodDescriptorClient) =>
  `TransactionResult<${getFunctionReturnReceipt(name, abi)}>`;

const getForwardType = (abi: ContractMethodDescriptorClient) =>
  hasForward(abi) ? '<TForwardOptions extends ForwardOptions<any>>' : '';

const getFunctionType = (name: string, abi: ContractMethodDescriptorClient, migration = false) =>
  genFunctionParameters(abi, abi.parameters, {
    migration,
  })
    .map((params) => `${getForwardType(abi)}(${params}): Promise<${getFunctionReturnType(name, abi)}>;`)
    .join('  \n');

const createConfirmedFunc = (abi: ContractMethodDescriptorClient, params: string, name: string, arrow = false) =>
  `${getForwardType(abi)}(${params})${arrow ? ' =>' : ':'} Promise<${getFunctionReturnReceipt(
    name,
    abi,
  )} & { readonly transaction: Transaction }>;`;
const getConfirmedType = (name: string, abi: ContractMethodDescriptorClient, migration = false) => {
  const paramss = genFunctionParameters(abi, abi.parameters, {
    withConfirmedOptions: true,
    migration,
  });

  if (paramss.length === 1) {
    return createConfirmedFunc(abi, paramss[0], name, true);
  }

  return `{
  ${paramss.map((params) => createConfirmedFunc(abi, params, name)).join('    \n')}
}`;
};

export interface GenFunctionOptions {
  readonly migration?: boolean;
}

export const genFunction = (name: string, abi: ContractMethodDescriptorClient, options: GenFunctionOptions): string =>
  options.migration
    ? getConfirmedType(name, abi, options.migration)
    : `{
  ${getFunctionType(name, abi, options.migration)}
  readonly confirmed: ${getConfirmedType(name, abi, options.migration)}
}`;
