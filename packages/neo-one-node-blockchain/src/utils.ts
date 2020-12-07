import { common, InvalidFormatError, IOHelper, ScriptBuilder, TriggerType, VMState } from '@neo-one/client-common';
import {
  ApplicationEngine,
  BlockBase,
  CallFlags,
  ContractState,
  Notification,
  Transaction,
  utils as coreUtils,
  Verifiable,
  VM,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { ScriptVerifyError } from './errors';

const hashListBatchSize = 2000;

const getOnPersistNativeContractScript = coreUtils.lazy(() => {
  const hashes = [common.nativeHashes.GAS, common.nativeHashes.NEO];
  const script = new ScriptBuilder();
  hashes.forEach((hash) => {
    script.emitAppCall(hash, 'onPersist');
    script.emitOp('DROP');
  });

  return script.build();
});

// tslint:disable-next-line: no-any
const isTransaction = (value: any): value is Transaction => value?.type === 'Transaction';

const getApplicationExecuted = (engine: ApplicationEngine, container?: Verifiable) => ({
  transaction: isTransaction(container) ? container : undefined,
  trigger: engine.trigger,
  state: engine.state,
  gasConsumed: engine.gasConsumed,
  stack: engine.resultStack,
  notifications: engine.notifications.map((item) => Notification.fromStackItem(item, container)),
});

const getCallReceipt = (engine: ApplicationEngine, container?: Verifiable) => ({
  state: engine.state,
  gasConsumed: engine.gasConsumed,
  stack: engine.resultStack,
  notifications: engine.notifications.map((item) => Notification.fromStackItem(item, container)),
});

const verifyContract = async (contract: ContractState, vm: VM, transaction: Transaction) => {
  const verify = contract.manifest.abi.getMethod('verify');
  if (verify === undefined) {
    throw new InvalidFormatError(`the smart contract ${contract.scriptHash} does not have a verify method`);
  }

  const init = contract.manifest.abi.getMethod('_initialize');
  const gas = vm.withApplicationEngine(
    {
      trigger: TriggerType.Verification,
      container: transaction,
      snapshot: 'clone',
      gas: new BN(0),
      testMode: true,
    },
    (engine) => {
      engine.loadScript(contract.script, CallFlags.None);
      engine.setInstructionPointer(verify.offset);
      if (init !== undefined) {
        engine.setInstructionPointer(init.offset);
      }

      engine.loadScript(Buffer.from([]), CallFlags.None);
      const result = engine.execute();

      if (result === VMState.FAULT) {
        throw new ScriptVerifyError(`contract ${contract.scriptHash} returned FAULT state`);
      }

      if (engine.resultStack.length !== 1 || !engine.resultStack[0].getBoolean()) {
        throw new ScriptVerifyError(`contract ${contract.scriptHash} returns false`);
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
  verifyContract,
  blockComparator,
  isTransaction,
};
