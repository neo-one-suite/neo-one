import { InvocationResult, InvocationResultError, InvocationResultSuccess, utils, VMState } from '@neo-one/client-core';
import { ExecuteScriptsResult } from '@neo-one/node-core';

export const wrapExecuteScripts = async (execute: (() => Promise<ExecuteScriptsResult>)): Promise<InvocationResult> => {
  try {
    const result = await execute();
    if (result.state === VMState.Halt) {
      return new InvocationResultSuccess({
        gasConsumed: result.gasConsumed,
        gasCost: result.gasCost,
        stack: result.stack,
      });
    }

    return new InvocationResultError({
      gasConsumed: result.gasConsumed,
      gasCost: result.gasCost,
      stack: result.stack,
      message: result.errorMessage === undefined ? 'Unknown Error' : result.errorMessage,
    });
  } catch (error) {
    return new InvocationResultError({
      gasConsumed: utils.ZERO,
      gasCost: utils.ZERO,
      stack: [],
      message: error.message,
    });
  }
};
