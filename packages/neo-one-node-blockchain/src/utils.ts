import {
  CallFlags,
  common,
  InvalidFormatError,
  IOHelper,
  ScriptBuilder,
  TriggerType,
  VMState,
} from '@neo-one/client-common';
import {
  ApplicationEngine,
  BlockBase,
  ContractState,
  Notification,
  Transaction,
  utils as coreUtils,
  Verifiable,
  VM,
} from '@neo-one/node-core';
import { ScriptVerifyError } from './errors';

const hashListBatchSize = 2000;

const getOnPersistNativeContractScript = coreUtils.lazy(() =>
  new ScriptBuilder().emitSysCall('System.Contract.NativeOnPersist').build(),
);

const getPostPersistNativeContractScript = coreUtils.lazy(() =>
  new ScriptBuilder().emitSysCall('System.Contract.NativePostPersist').build(),
);

// tslint:disable-next-line: no-any
const isTransaction = (value: any): value is Transaction => value?.type === 'Transaction';

const getApplicationExecuted = (engine: ApplicationEngine, container?: Verifiable) => ({
  transaction: isTransaction(container) ? container : undefined,
  trigger: engine.trigger,
  state: engine.state,
  gasConsumed: engine.gasConsumed,
  exception: engine.faultException,
  stack: engine.resultStack,
  notifications: engine.notifications.map((item) => Notification.fromStackItem(item, container)),
  logs: engine.logs,
});

const getCallReceipt = (engine: ApplicationEngine, container?: Verifiable) => ({
  state: engine.state,
  gasConsumed: engine.gasConsumed,
  stack: engine.resultStack,
  exception: engine.faultException,
  notifications: engine.notifications.map((item) => Notification.fromStackItem(item, container)),
  logs: engine.logs,
});

const verifyContract = async (contract: ContractState, vm: VM, transaction: Transaction) => {
  const gas = vm.withApplicationEngine(
    {
      trigger: TriggerType.Verification,
      container: transaction,
      snapshot: 'clone',
      gas: common.TWENTY_FIXED8,
    },
    (engine) => {
      const loaded = engine.loadContract({
        hash: contract.hash,
        flags: CallFlags.None,
        method: 'verify',
        pcount: -1, // TODO: verify this
      });

      if (!loaded) {
        throw new InvalidFormatError(`contract with hash: ${contract.hash} does not have a verify method.`);
      }

      const result = engine.execute();
      if (result === VMState.FAULT) {
        throw new ScriptVerifyError(`contract ${contract.hash} returned FAULT state`);
      }

      if (engine.resultStack.length !== 1 || !engine.resultStack[0].getBoolean()) {
        throw new ScriptVerifyError(`contract ${contract.hash} returns false`);
      }

      return engine.gasConsumed;
    },
  );

  return { fee: gas, size: IOHelper.sizeOfUInt8 * 2 };
};

const blockComparator = <TBlock extends BlockBase>({ index: aIndex }: TBlock, { index: bIndex }: TBlock) => {
  if (aIndex > bIndex) {
    return 1;
  }

  if (aIndex < bIndex) {
    return -1;
  }

  return 0;
};

export const utils = {
  ...coreUtils,
  hashListBatchSize,
  getApplicationExecuted,
  getCallReceipt,
  getOnPersistNativeContractScript,
  getPostPersistNativeContractScript,
  verifyContract,
  blockComparator,
  isTransaction,
};
