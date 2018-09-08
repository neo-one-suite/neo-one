import { ABIFunction } from '@neo-one/client';
import { toTypeScriptType } from '../utils';

export const genForwardReturnFunction = (abi: ABIFunction): string => {
  const returnType = toTypeScriptType(abi.returnType, { isParameter: false });

  return `{
  <T extends InvokeReceipt<ContractParameter>>(receipt: T): T extends InvokeReceipt<ContractParameter, infer E> ? InvokeReceipt<${returnType}, E> : never;
  (result: ContractParameter): ${returnType}
}`;
};
