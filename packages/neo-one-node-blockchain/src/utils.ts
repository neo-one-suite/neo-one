import { common, ScriptBuilder, UInt160 } from '@neo-one/client-common';
import { ApplicationEngine, Transaction, utils as coreUtils } from '@neo-one/node-core';

interface BaseNativeContract {
  readonly hash: UInt160;
}

// TODO: Implement
class NativeContract implements BaseNativeContract {
  public static readonly GAS: BaseNativeContract = {
    hash: common.stringToUInt160('bcaf41d684c7d4ad6ee0d99da9707b9d1f0c8e66'),
  };
  public static readonly NEO: BaseNativeContract = {
    hash: common.stringToUInt160('25059ecb4878d3a875f91c51ceded330d4575fde'),
  };
  public readonly hash: UInt160;

  public constructor(hash: UInt160) {
    this.hash = hash;
  }
}

export const getOnPersistNativeContractScript = coreUtils.lazy(() => {
  const contracts = [NativeContract.GAS, NativeContract.NEO];
  const script = new ScriptBuilder();
  contracts.forEach((contract) => {
    script.emitAppCall(contract.hash, 'onPersist');
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
