import { ABIFunction } from '@neo-one/client-common';
import { toTypeScriptType } from '../utils';
import { getEventName } from './getEventName';

export const genForwardReturnFunction = (name: string, abi: ABIFunction): string => {
  const returnType = toTypeScriptType(abi.returnType, { isParameter: false });

  return `{
  <T extends InvokeReceipt<ContractParameter>>(receipt: T): T extends InvokeReceipt<ContractParameter, infer E> ? InvokeReceipt<${returnType}, E | ${getEventName(
    name,
  )}> : never;
  (result: ContractParameter): ${returnType}
}`;
};
