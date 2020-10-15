import {
  common,
  Contract,
  crypto,
  InvalidFormatError,
  IOHelper,
  Op,
  ScriptBuilder,
  UInt160,
  VMState,
} from '@neo-one/client-common';
import {
  ApplicationEngine,
  BlockBase,
  BlockchainStorage,
  CallFlags,
  ECDsaVerifyPrice,
  getOpCodePrice,
  Transaction,
  TriggerType,
  utils as coreUtils,
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

const getApplicationExecuted = (engine: ApplicationEngine, transaction?: Transaction) => ({
  transaction,
  trigger: engine.trigger,
  state: engine.state,
  gasConsumed: engine.gasConsumed,
  stack: engine.resultStack,
  notifications: engine.notifications,
});

const getCallReceipt = (engine: ApplicationEngine) => ({
  state: engine.state,
  gasConsumed: engine.gasConsumed,
  stack: engine.resultStack,
  notifications: engine.notifications,
});

export interface TempWalletAccount {
  readonly contract?: Contract;
}

export type GetAccount = (hash: UInt160) => TempWalletAccount | undefined;

export const getCalculateNetworkFee = (
  vm: VM,
  storage: BlockchainStorage,
  getAccount: GetAccount,
  feePerByte: number,
) => async (transaction: Transaction) => {
  const hashes = transaction.getScriptHashesForVerifying();
  // TODO: verify this size matches up across environments
  const initSize =
    Transaction.headerSize +
    IOHelper.sizeOfArray(transaction.signers, (signer) => signer.size) +
    IOHelper.sizeOfArray(transaction.attributes, (attr) => attr.size) +
    IOHelper.sizeOfVarBytesLE(transaction.script) +
    IOHelper.sizeOfVarUIntLE(hashes.length);

  const { fee, size } = await hashes.reduce(async (acc, hash) => {
    const { fee: prevFee, size: prevSize } = await acc;
    const { fee: nextFee, size: nextSize } = await verifyContract(hash, getAccount, storage, vm, transaction);

    return { fee: prevFee.add(nextFee), size: prevSize + nextSize };
  }, Promise.resolve({ fee: new BN(0), size: 0 }));

  return fee.addn(feePerByte * (size + initSize));
};

const verifyContract = async (
  hash: UInt160,
  getAccount: GetAccount,
  storage: BlockchainStorage,
  vm: VM,
  transaction: Transaction,
) => {
  const witnessScriptHex = getAccount(hash)?.contract?.script;
  const witnessScript = witnessScriptHex ? Buffer.from(witnessScriptHex, 'hex') : undefined;
  if (witnessScript === undefined) {
    const contract = await storage.contracts.tryGet(hash);
    if (contract === undefined) {
      return { fee: coreUtils.ZERO, size: 0 };
    }

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
        gas: 0,
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

    // TODO: once again need to verify decimal places on return types
    return { fee: common.fixed8FromDecimal(gas.toString()), size: IOHelper.sizeOfUInt8 * 2 };
  }
  if (crypto.isSignatureContract(witnessScript)) {
    const sigSize = IOHelper.sizeOfVarBytesLE(witnessScript) + 67;
    const sigFee = getOpCodePrice(Op.PUSHDATA1).muln(2).add(getOpCodePrice(Op.PUSHNULL)).add(ECDsaVerifyPrice);

    return { fee: sigFee, size: sigSize };
  }
  const multiSig = crypto.isMultiSigContractWithResult(witnessScript);
  if (multiSig.result) {
    const { m, n } = multiSig;
    const sizeInv = m * 66;
    const sizeMulti = IOHelper.sizeOfVarUIntLE(sizeInv) + sizeInv + IOHelper.sizeOfVarBytesLE(witnessScript);

    const initMFee = getOpCodePrice(Op.PUSHDATA1).muln(m);
    const mBuilder = new ScriptBuilder();
    const mScript = mBuilder.emitPushInt(m).build();
    const mFee = getOpCodePrice(mScript[0]).add(initMFee);

    const initNFee = getOpCodePrice(Op.PUSHDATA1).muln(n);
    const nBuilder = new ScriptBuilder();
    const nScript = nBuilder.emitPushInt(n).build();
    const nFee = getOpCodePrice(nScript[0]).add(initNFee);

    const totalFee = getOpCodePrice(Op.PUSHNULL).add(ECDsaVerifyPrice.muln(n)).add(mFee).add(nFee);

    return { fee: totalFee, size: sizeMulti };
  }

  return { fee: coreUtils.ZERO, size: 0 };
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
  getCalculateNetworkFee,
  blockComparator,
};
