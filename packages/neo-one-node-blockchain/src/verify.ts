import { common, TriggerType, UInt160, VMState } from '@neo-one/client-common';
import {
  BlockchainStorage,
  CallFlags,
  ContractMethodDescriptor,
  ExecuteScriptResult,
  NativeContainer,
  SerializableContainer,
  Verifiable,
  VM,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { ContractMethodError, ContractStateFetchError, WitnessVerifyError } from './errors';

const maxVerificationGas = common.fixed8FromDecimal('0.5');

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

  // tslint:disable-next-line: possible-timing-attack TODO: look into this `possible-timing-attack` warning
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
  gas: BN,
  offset: number,
  init?: ContractMethodDescriptor,
): ExecuteScriptResult =>
  vm.withApplicationEngine(
    { trigger: TriggerType.Verification, container: verifiable, snapshot: 'clone', gas, testMode: false },
    (engine) => {
      engine.loadScript(verification, CallFlags.None);
      engine.setInstructionPointer(offset);
      if (init !== undefined) {
        engine.setInstructionPointer(init.offset);
      }
      engine.loadScript(verifiable.witnesses[index].invocation, CallFlags.None);

      const state = engine.execute();
      if (state === VMState.FAULT) {
        return { result: false, gas };
      }

      const stack = engine.resultStack;
      if (stack.length !== 1 || !stack[0].getBoolean()) {
        return { result: false, gas };
      }

      return { result: true, gas: gas.sub(engine.gasConsumed) };
    },
  );

export const tryVerifyHash = async (
  vm: VM,
  hash: UInt160,
  index: number,
  storage: BlockchainStorage,
  verifiable: Verifiable & SerializableContainer,
  gas: BN,
): Promise<ExecuteScriptResult> => {
  const { verification: verificationScript, scriptHash } = verifiable.witnesses[index];
  try {
    const { verification, offset, init } = await getApplicationEngineVerifyOptions(
      verificationScript,
      storage,
      hash,
      scriptHash,
    );

    return verifyWithApplicationEngine(vm, verifiable, verification, index, gas, offset, init);
  } catch {
    return { gas, result: false };
  }
};

export const verifyWitnesses = async (
  vm: VM,
  verifiable: Verifiable & SerializableContainer,
  storage: BlockchainStorage,
  native: NativeContainer,
  gasIn: BN,
): Promise<boolean> => {
  if (gasIn.ltn(0)) {
    return false;
  }

  const gas = gasIn.gt(maxVerificationGas) ? maxVerificationGas : gasIn;

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
