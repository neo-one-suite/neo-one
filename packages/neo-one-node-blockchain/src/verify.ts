import {
  assertValidScript,
  CallFlags,
  ContractParameterTypeModel,
  crypto,
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
}: VerifyWitnessOptions): Promise<ExecuteScriptResult> => {
  const initFee = new BN(0);
  const { verification, invocation } = witness;

  try {
    assertValidScript(invocation);
  } catch {
    return { result: false, gas: initFee };
  }

  const callFlags = !crypto.isStandardContract(verification) ? CallFlags.ReadStates : CallFlags.None;

  let contract: ContractState | undefined;
  if (verification.length === 0) {
    contract = await native.ContractManagement.getContract(storage, hash);
    if (contract === undefined) {
      return { result: false, gas: initFee };
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
    },
    async (engine) => {
      if (contract !== undefined) {
        const methodDescriptor = contract.manifest.abi.getMethod('verify', -1);
        if (methodDescriptor?.returnType !== ContractParameterTypeModel.Boolean) {
          return { result: false, gas: initFee };
        }

        engine.loadContract({
          hash,
          method: 'verify',
          pcount: -1,
          flags: callFlags,
        });
      } else {
        if (native.isNative(hash)) {
          return { result: false, gas: initFee };
        }

        if (!hash.equals(witness.scriptHash)) {
          return { result: false, gas: initFee };
        }

        try {
          assertValidScript(verification);
        } catch {
          return { result: false, gas: initFee };
        }

        engine.loadScript({ script: verification, flags: callFlags, scriptHash: hash, initialPosition: 0 });
      }

      engine.loadScript({ script: invocation, flags: CallFlags.None });
      if (native.isNative(hash)) {
        try {
          engine.stepOut();
          engine.push('verify');
        } catch {
          // do nothing
        }
      }
      const result = engine.execute();

      if (result === VMState.FAULT) {
        return { result: false, gas: initFee };
      }

      if (!engine.resultStack[0].getBoolean()) {
        return { result: false, gas: initFee };
      }

      return { result: true, gas: engine.gasConsumed };
    },
  );
};
