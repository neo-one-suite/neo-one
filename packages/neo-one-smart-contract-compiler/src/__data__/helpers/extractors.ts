import { ContractParameter, ContractParameterType, InvocationResult, VMState } from '@neo-one/client-core';
import { BN } from 'bn.js';
import { RawSourceMap } from 'source-map';
import { processError } from '@neo-one/client-switch';

export const checkResult = async (result: InvocationResult, sourceMap: RawSourceMap) => {
  if (result.state === VMState.Fault) {
    const message = await processError({ message: result.message, sourceMap });
    throw new Error(`Error in execution: ${message}`);
  }
};

const checkStackLength = (result: InvocationResult, length: number) => {
  if (result.state === VMState.Fault) {
    throw new Error(`Error in execution: ${result.message}`);
  }

  if (result.stack.length !== length) {
    throw new Error(`Result stack had length ${result.stack.length}. Expected ${length}.`);
  }
};

const throwBadType = (item: ContractParameter, type: ContractParameterType): any => {
  throw new Error(`Expected stack element to be ${type}, was ${item.type}`);
};

export const toNumber = (result: InvocationResult): BN => {
  checkStackLength(result, 1);

  const item = result.stack[0];
  if (item.type === ContractParameterType.Integer) {
    return item.value;
  }

  return throwBadType(item, ContractParameterType.Integer);
};
