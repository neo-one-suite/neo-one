import BN from 'bn.js';
import {
  VMState,
  ContractParameter,
  ContractParameterType,
  InvocationResult,
} from '@neo-one/client-core';

export const checkResult = (result: InvocationResult) => {
  if (result.state === VMState.Fault) {
    throw new Error(`Error in execution: ${result.message}`);
  }
};

const checkStackLength = (result: InvocationResult, length: number) => {
  if (result.state === VMState.Fault) {
    throw new Error(`Error in execution: ${result.message}`);
  }

  if (result.stack.length !== length) {
    throw new Error(
      `Result stack had length ${result.stack.length}. Expected ${length}.`,
    );
  }
};

const throwBadType = (
  item: ContractParameter,
  type: ContractParameterType,
): any => {
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
