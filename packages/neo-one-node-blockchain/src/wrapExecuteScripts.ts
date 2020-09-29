import { ApplicationEngine, CallReceipt } from '@neo-one/node-core';

// TODO: we might need to visit this again if we implement error handling in the VM
export const wrapExecuteScripts = (applicationEngine: ApplicationEngine): CallReceipt => {
  const result = applicationEngine.execute();
  if (result === 'HALT') {
    return {
      state: 'HALT',
      gasConsumed: applicationEngine.gasConsumed,
      stack: applicationEngine.resultStack,
      notifications: applicationEngine.notifications,
    };
  }

  return {
    state: result,
    gasConsumed: applicationEngine.gasConsumed,
    stack: applicationEngine.resultStack,
    notifications: [],
  };
};
