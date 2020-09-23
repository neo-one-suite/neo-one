import { ScriptBuilder } from '@neo-one/client-common';
import { ApplicationEngine, NativeHashes, Transaction, utils as coreUtils } from '@neo-one/node-core';

const getOnPersistNativeContractScript = coreUtils.lazy(() => {
  const hashes = [NativeHashes.GAS, NativeHashes.NEO];
  const script = new ScriptBuilder();
  hashes.forEach((hash) => {
    script.emitAppCall(hash, 'onPersist');
    script.emitOp('DROP');
  });

  return script.build();
});

const hashListBatchSize = 2000;

const getApplicationExecuted = (engine: ApplicationEngine, transaction?: Transaction) => ({
  transaction,
  trigger: engine.trigger,
  state: engine.state,
  gasConsumed: engine.gasConsumed,
  stack: engine.resultStack,
  // notifications: engine.notifications,
});

export const utils = {
  ...coreUtils,
  hashListBatchSize,
  getApplicationExecuted,
  getOnPersistNativeContractScript,
};
