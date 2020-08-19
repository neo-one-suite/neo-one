import { UInt160 } from '@neo-one/client-common';
import {
  BooleanStackItem,
  CallFlags,
  SnapshotMethods,
  TriggerType,
  Verifiable,
  VerifyResult,
} from '@neo-one/csharp-core';
import { withApplicationEngine } from '@neo-one/csharp-vm';

const maxVerificationGas = 0.5;

interface ApplicationEngineVerifyOptions {
  readonly verification: Buffer;
  readonly offset: number;
  readonly init?: ContractMethodDescriptor;
}

const getApplicationEngineVerifyOptions = async (
  verification: Buffer,
  snapshot: SnapshotMethods,
  hash: UInt160,
  scriptHash: UInt160,
): Promise<ApplicationEngineVerifyOptions> => {
  if (verification.length === 0) {
    const contractState = await snapshot.tryGetContract(hash);
    if (contractState === undefined) {
      // TODO: implement an error
      throw new Error('Failed to fetch contract from storage');
    }
    const methodDescriptor = contractState.manifest.abi.getMethod('verify');
    if (methodDescriptor === undefined) {
      // TODO: implement an error
      throw new Error('Failed to get contract verify method');
    }

    return {
      verification: contractState.script,
      offset: methodDescriptor.offset,
      init: contractState.manifest.abi.getMethod('_initialize'),
    };
  }

  // TODO: look into this `possible-timing-attack` warning
  if (hash !== scriptHash) {
    throw new Error('Witness hash does not match verification hash');
  }

  return {
    verification,
    offset: 0,
  };
};

export const verifyWithApplicationEngine = (
  verifiable: Verifiable,
  verification: Buffer,
  index: number,
  gas: number,
  offset: number,
  init?: ContractMethodDescriptor,
): VerifyResult =>
  withApplicationEngine({ trigger: TriggerType.Verification, container: verifiable, snapshot: true, gas }, (engine) => {
    engine.loadScript(verification);
    engine.loadClonedContext(offset);
    if (init !== undefined) {
      engine.loadClonedContext(init.offset);
    }
    engine.loadScript(verifiable.witnesses[index].invocation, CallFlags.None);

    const state = engine.execute();
    if (state === 'FAULT') {
      return { result: false, gas };
    }

    const stack = engine.resultStack;
    if (stack.length !== 1 || !(stack[0] as BooleanStackItem).value) {
      return { result: false, gas };
    }

    return { result: true, gas: gas - engine.gasConsumed };
  });

export const tryVerifyHash = async (
  hash: UInt160,
  index: number,
  snapshot: SnapshotMethods,
  verifiable: Verifiable,
  gas: number,
): Promise<VerifyResult> => {
  const { verification: verificationScript, scriptHash } = verifiable.witnesses[index];
  try {
    const { verification, offset, init } = await getApplicationEngineVerifyOptions(
      verificationScript,
      snapshot,
      hash,
      scriptHash,
    );

    return verifyWithApplicationEngine(verifiable, verification, index, gas, offset, init);
  } catch {
    return { gas, result: false };
  }
};

export const verifyWitnesses = async (
  verifiable: Verifiable,
  snapshot: SnapshotMethods,
  gasIn: number,
): Promise<boolean> => {
  if (gasIn < 0) {
    return false;
  }

  const gas = gasIn > maxVerificationGas ? maxVerificationGas : gasIn;

  let hashes: readonly UInt160[];
  try {
    hashes = await verifiable.getScriptHashesForVerifying(snapshot);
  } catch {
    return false;
  }

  if (hashes.length !== verifiable.witnesses.length) {
    return false;
  }

  const { next, previous } = await hashes
    .slice(1)
    .reduce<Promise<{ readonly next: Promise<VerifyResult>; readonly previous: boolean }>>(async (acc, hash, index) => {
      const { next: accNext, previous: accPrevious } = await acc;
      const { result, gas: newGas } = await accNext;
      if (!result) {
        return {
          next: Promise.resolve({ result: false, gas: newGas }),
          previous: false,
        };
      }

      return {
        next: tryVerifyHash(hash, index, snapshot, verifiable, newGas),
        previous: accPrevious && result,
      };
    }, Promise.resolve({ next: tryVerifyHash(hashes[0], 0, snapshot, verifiable, gas), previous: true }));

  const { result: finalResult } = await next;

  return finalResult && previous;
};
