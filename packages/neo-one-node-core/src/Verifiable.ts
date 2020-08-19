import { BinaryWriter, common, ContractMethodDescriptor, UInt160, UInt256 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Contract } from './Contract';
import { Header } from './Header';
import { StorageItem } from './StorageItem';
import { TrimmedBlock } from './TrimmedBlock';
import { BinaryReader } from './utils';
import { Witness } from './Witness';

const maxVerificationGas = common.fixed8FromDecimal(0.5);

export interface SnapshotMethods {
  readonly tryGetBlock: (hash: UInt256) => Promise<TrimmedBlock | undefined>;
  readonly tryGetHeader: (hash: UInt256) => Promise<Header | undefined>;
  readonly tryGetContract: (hash: UInt160) => Promise<Contract | undefined>;
  readonly tryGetStorage: (key: StorageKey) => Promise<StorageItem | undefined>;
}

export interface Verifiable {
  readonly getScriptHashesForVerifying: (snapshot: SnapshotMethods) => Promise<readonly UInt160[]>;
  readonly witnesses: readonly Witness[];
}

export interface VerifyResult {
  readonly gas: BN;
  readonly result: boolean;
}

export const verifyWithApplicationEngine = (
  verifiable: Verifiable,
  verification: Buffer,
  index: number,
  gas: BN,
  offset: number,
  init?: ContractMethodDescriptor,
): VerifyResult =>
  withApplicationEngine({ trigger: TriggerType.Verification, verifiable, snapshot: true, gas }, (engine) => {
    engine.loadScript(verification, CallFlags.None);
    engine.setInstructionPointer(offset);
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

    return { result: true, gas: gas.sub(engine.gasConsumed) };
  });

export const tryVerifyHash = async (
  hash: UInt160,
  index: number,
  snapshot: SnapshotMethods,
  verifiable: Verifiable,
  gas: BN,
): Promise<VerifyResult> => {
  const verificationScript = verifiable.witnesses[index].verification;
  if (verificationScript.length === 0) {
    const contractState = await snapshot.tryGetContract(hash);
    if (contractState === undefined) {
      return { result: false, gas };
    }
    const methodDescriptor = contractState.manifest.abi.getMethod('verify');
    if (methodDescriptor === undefined) {
      return { result: false, gas };
    }

    const verification = contractState.script;
    const offset = methodDescriptor.offset;
    const init = contractState.manifest.abi.getMethod('_initialize');

    return verifyWithApplicationEngine(verifiable, verification, index, gas, offset, init);
  }

  if (hash !== verifiable.witnesses[index].scriptHash) {
    return { result: false, gas };
  }

  return verifyWithApplicationEngine(verifiable, verificationScript, index, gas, 0);
};

export const verifyWitnesses = async (
  verifiable: Verifiable,
  snapshot: SnapshotMethods,
  gasIn: BN,
): Promise<boolean> => {
  if (gasIn.ltn(0)) {
    return false;
  }

  const gas = gasIn.gt(maxVerificationGas) ? maxVerificationGas : gasIn;

  let hashes: readonly UInt160[];
  try {
    hashes = await verifiable.getScriptHashesForVerifying(snapshot);
  } catch {
    return false;
  }

  if (hashes.length !== verifiable.witnesses.length) {
    return false;
  }

  const { next, previous } = hashes
    .slice(1)
    .reduce<{ readonly next: Promise<VerifyResult>; readonly previous: boolean }>(
      async (acc, hash, index) => {
        const { result, gas: newGas } = await acc.next;
        if (!result) {
          return {
            next: Promise.resolve({ result: false, gas: newGas }),
            previous: false,
          };
        }

        return {
          next: tryVerifyHash(hash, index, snapshot, verifiable, newGas),
          previous: acc.previous && result,
        };
      },
      { next: tryVerifyHash(hashes[0], 0, snapshot, verifiable, gas), previous: true },
    );
};
