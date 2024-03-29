import {
  CallFlags,
  common,
  ContractParameterTypeModel,
  Script,
  TriggerType,
  UInt160,
  VMState,
} from '@neo-one/client-common';
import {
  ContractState,
  ExecuteScriptResult,
  maxVerificationGas,
  VerifyWitnessesOptions,
  VerifyWitnessOptions,
} from '@neo-one/node-core';
import { BN } from 'bn.js';

export const verifyWitnesses = async ({
  vm,
  verifiable,
  storage,
  native,
  gas: gasIn,
  snapshot,
  headerCache,
  settings,
}: VerifyWitnessesOptions): Promise<boolean> => {
  if (gasIn.ltn(0)) {
    return false;
  }

  let gas = gasIn.gt(maxVerificationGas) ? maxVerificationGas : gasIn;

  let hashes: readonly UInt160[];
  try {
    hashes = await verifiable.getScriptHashesForVerifying({ storage, native, headerCache });
  } catch {
    return false;
  }

  if (hashes.length !== verifiable.witnesses.length) {
    return false;
  }

  // tslint:disable-next-line: no-loop-statement
  for (let i = 0; i < hashes.length; i += 1) {
    const { result, gas: gasCost } = await verifyWitness({
      vm,
      verifiable,
      storage,
      native,
      headerCache,
      hash: hashes[i],
      snapshot,
      witness: verifiable.witnesses[i],
      gas,
      settings,
    });

    if (!result) {
      return false;
    }

    gas = gas.sub(gasCost);
  }

  return true;
};

export const verifyWitness = async ({
  vm,
  verifiable,
  snapshot: snapshotIn,
  storage,
  native,
  hash,
  witness,
  gas,
  settings,
}: VerifyWitnessOptions): Promise<ExecuteScriptResult> => {
  const initFee = new BN(0);
  const { verification, invocation } = witness;

  try {
    // tslint:disable-next-line: no-unused-expression
    new Script(invocation, true);
  } catch (error) {
    return { result: false, gas: initFee, failureReason: `Invocation script is invalid: ${error.message}` };
  }

  let contract: ContractState | undefined;
  if (verification.length === 0) {
    contract = await native.ContractManagement.getContract(storage, hash);
    if (contract === undefined) {
      return { result: false, gas: initFee, failureReason: `Contract not found: ${common.uInt160ToString(hash)}` };
    }
  }

  const snapshot = snapshotIn ?? 'clone';
  vm.withSnapshots(({ main }) => {
    if (snapshotIn === 'clone') {
      main.clone();
    }
  });

  return vm.withApplicationEngine(
    {
      trigger: TriggerType.Verification,
      container: verifiable,
      snapshot,
      gas,
      settings,
    },
    async (engine) => {
      if (contract !== undefined) {
        const methodDescriptor = contract.manifest.abi.getMethod('verify', -1);
        if (methodDescriptor?.returnType !== ContractParameterTypeModel.Boolean) {
          return { result: false, gas: initFee, failureReason: `Contract verify method's return type is not boolean` };
        }

        engine.loadContract({
          hash,
          method: 'verify',
          pcount: -1,
          flags: CallFlags.ReadOnly,
        });
      } else {
        if (native.isNative(hash)) {
          return {
            result: false,
            gas: initFee,
            failureReason: `Cannot use native contract for verification: ${common.uInt160ToString(hash)}`,
          };
        }

        if (!hash.equals(witness.scriptHash)) {
          return {
            result: false,
            gas: initFee,
            failureReason: `Expected contract hash ${common.uInt160ToString(
              hash,
            )} to equal witness script hash ${common.uInt160ToString(witness.scriptHash)}`,
          };
        }

        try {
          // tslint:disable-next-line: no-unused-expression
          new Script(verification, true);
        } catch (error) {
          return { result: false, gas: initFee, failureReason: `Verification script is invalid: ${error.message}` };
        }

        engine.loadScript({ script: verification, flags: CallFlags.ReadOnly, scriptHash: hash, initialPosition: 0 });
      }

      engine.loadScript({ script: invocation, flags: CallFlags.None });
      const result = engine.execute();

      if (result === VMState.FAULT) {
        return { result: false, gas: initFee, failureReason: `Invocation script execution resulted in FAULT state` };
      }

      if (!engine.resultStack[0].getBoolean()) {
        return { result: false, gas: initFee, failureReason: `Invocation script execution returned false` };
      }

      return { result: true, gas: engine.gasConsumed };
    },
  );
};
