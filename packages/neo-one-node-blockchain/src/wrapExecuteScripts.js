/* @flow */
import {
  VM_STATE,
  type InvocationResult,
  InvocationResultSuccess,
  InvocationResultError,
  utils,
} from '@neo-one/client-core';
import { type ExecuteScriptsResult } from '@neo-one/node-core';

export default async (
  execute: () => Promise<ExecuteScriptsResult>,
): Promise<InvocationResult> => {
  try {
    const result = await execute();
    if (result.state === VM_STATE.HALT) {
      return new InvocationResultSuccess({
        gasConsumed: result.gasConsumed,
        stack: result.stack,
      });
    }
    return new InvocationResultError({
      gasConsumed: result.gasConsumed,
      stack: result.stack,
      message:
        result.errorMessage == null ? 'Unknown Error' : result.errorMessage,
    });
  } catch (error) {
    return new InvocationResultError({
      gasConsumed: utils.ZERO,
      stack: [],
      message: error.message,
    });
  }
};
