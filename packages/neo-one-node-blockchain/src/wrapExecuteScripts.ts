import { VMState } from '@neo-one/client-common';
import { ApplicationEngine, CallReceipt } from '@neo-one/node-core';

// TODO: implement the notification grabbing
export const wrapExecuteScripts = (applicationEngine: ApplicationEngine): CallReceipt => {
  const result = applicationEngine.execute();
  if (result === VMState.HALT) {
    return {
      state: result,
      gasConsumed: applicationEngine.gasConsumed,
      stack: applicationEngine.resultStack,
      // notifications: applicationEngine.notifications,
    };
  }

  return {
    state: result,
    gasConsumed: applicationEngine.gasConsumed,
    stack: applicationEngine.resultStack,
    // notifications: [],
  };
};
