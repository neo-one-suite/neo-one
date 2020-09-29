import { ContractMethodDescriptorClient } from '@neo-one/client-common';
import { upperCaseFirst } from '@neo-one/utils';

export const createForwardedValueFuncArgsName = (func: ContractMethodDescriptorClient) =>
  `forward${upperCaseFirst(func.name)}Args`;
export const createForwardedValueFuncReturnName = (func: ContractMethodDescriptorClient) =>
  `forward${upperCaseFirst(func.name)}Return`;
