import { common, UInt160, VMState } from '@neo-one/client-common';
import {
  BlockchainStorage,
  CallFlags,
  ContractMethodDescriptor,
  ExecuteScriptResult,
  NativeContainer,
  SerializableContainer,
  TriggerType,
  Verifiable,
  VM,
} from '@neo-one/node-core';
import { ContractMethodError, ContractStateFetchError, WitnessVerifyError } from './errors';

const maxVerificationGas = 0.5;

interface ApplicationEngineVerifyOptions {
  readonly verification: Buffer;
  readonly offset: number;
  readonly init?: ContractMethodDescriptor;
}

const getApplicationEngineVerifyOptions = async (
  verification: Buffer,
  storage: BlockchainStorage,
  hash: UInt160,
  scriptHash: UInt160,
): Promise<ApplicationEngineVerifyOptions> => {
  if (verification.length === 0) {
    const contractState = await storage.contracts.tryGet(hash);
    if (contractState === undefined) {
      throw new ContractStateFetchError(common.uInt160ToHex(hash));
    }
    const methodDescriptor = contractState.manifest.abi.getMethod('verify');
    if (methodDescriptor === undefined) {
      throw new ContractMethodError('verify', common.uInt160ToHex(hash));
    }

    return {
      verification: contractState.script,
      offset: methodDescriptor.offset,
      init: contractState.manifest.abi.getMethod('_initialize'),
    };
  }

  if (!hash.equals(scriptHash)) {
    throw new WitnessVerifyError();
  }

  return {
    verification,
    offset: 0,
  };
};

export const verifyWithApplicationEngine = (
  vm: VM,
  verifiable: Verifiable & SerializableContainer,
  verification: Buffer,
  index: number,
  gas: number,
  offset: number,
  init?: ContractMethodDescriptor,
): ExecuteScriptResult =>
  vm.withApplicationEngine(
    {
      trigger: TriggerType.Verification,
      container: verifiable,
      snapshot: 'clone',
      gas,
      testMode: true,
    },
    (engine) => {
      // console.log('VWAE 0');
      // console.log('loading verification script:');
      // console.log(verification.toString('base64'));
      engine.loadScript(verification, CallFlags.None);
      engine.setInstructionPointer(offset);
      if (init !== undefined) {
        engine.setInstructionPointer(init.offset);
      }
      // console.log('VWAE 03');
      // console.log('loading invocation script:');
      // console.log(verifiable.witnesses[index].invocation.toString('base64'));
      engine.loadScript(verifiable.witnesses[index].invocation, CallFlags.None);

      // console.log('VWAE 04');
      const state = engine.execute();
      if (state === VMState.FAULT) {
        return { result: false, gas };
      }

      // console.log('just before result stack');
      const stack = engine.resultStack;
      // console.log('just after reuslt stack');
      if (stack.length !== 1 || !stack[0].getBoolean()) {
        // console.log('VWPE 2');

        return { result: false, gas };
      }

      // console.log('returning from VWPE 06');

      return { result: true, gas: gas - engine.gasConsumed };
    },
  );

export const tryVerifyHash = async (
  vm: VM,
  hash: UInt160,
  index: number,
  storage: BlockchainStorage,
  verifiable: Verifiable & SerializableContainer,
  gas: number,
): Promise<ExecuteScriptResult> => {
  const { verification: verificationScript, scriptHash } = verifiable.witnesses[index];
  try {
    const { verification, offset, init } = await getApplicationEngineVerifyOptions(
      verificationScript,
      storage,
      hash,
      scriptHash,
    );
    // console.log('trying verifyHash w/ AppEngine');

    return verifyWithApplicationEngine(vm, verifiable, verification, index, gas, offset, init);
  } catch (e) {
    // console.log('appengine threw');
    // console.log(e);

    return { gas, result: false };
  }
};

export const verifyWitnesses = async (
  vm: VM,
  verifiable: Verifiable & SerializableContainer,
  storage: BlockchainStorage,
  native: NativeContainer,
  gasIn: number,
): Promise<boolean> => {
  if (gasIn < 0) {
    return false;
  }

  const gas = gasIn > maxVerificationGas ? maxVerificationGas : gasIn;

  let hashes: readonly UInt160[];
  try {
    hashes = await verifiable.getScriptHashesForVerifying({ storage, native });
  } catch {
    return false;
  }

  if (hashes.length !== verifiable.witnesses.length) {
    return false;
  }

  const { next, previous } = await hashes
    .slice(1)
    .reduce<Promise<{ readonly next: Promise<ExecuteScriptResult>; readonly previous: boolean }>>(
      async (acc, hash, index) => {
        const { next: accNext, previous: accPrevious } = await acc;
        const { result, gas: newGas } = await accNext;
        if (!result) {
          return {
            next: Promise.resolve({ result: false, gas: newGas }),
            previous: false,
          };
        }

        return {
          next: tryVerifyHash(vm, hash, index, storage, verifiable, newGas),
          previous: accPrevious && result,
        };
      },
      Promise.resolve({ next: tryVerifyHash(vm, hashes[0], 0, storage, verifiable, gas), previous: true }),
    );

  const { result: finalResult } = await next;

  return finalResult && previous;
};
