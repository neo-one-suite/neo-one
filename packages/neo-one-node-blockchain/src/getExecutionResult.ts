import { VMState } from '@neo-one/client-common';
import { ExecutionResult, ExecutionResultError, ExecutionResultSuccess, StackItem } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { utils } from './utils';

export function getExecutionResult(result: {
  readonly state: VMState;
  readonly gasConsumed: BN;
  readonly stack: readonly StackItem[];
  readonly exception?: string;
}): ExecutionResult {
  try {
    if (result.state === VMState.HALT) {
      return new ExecutionResultSuccess({
        gasConsumed: result.gasConsumed,
        stack: result.stack.map((item) => item.toContractParameter()),
      });
    }

    return new ExecutionResultError({
      gasConsumed: result.gasConsumed,
      stack: result.stack.map((item) => item.toContractParameter()),
      message: result.exception === undefined ? 'Unknown Error' : result.exception,
    });
  } catch (error) {
    return new ExecutionResultError({
      gasConsumed: utils.ZERO,
      stack: [],
      message: error.message,
    });
  }
}
