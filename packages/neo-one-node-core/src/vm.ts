import { TriggerType, UInt160, UInt256, VMState } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Block } from './Block';
import { CallFlags } from './CallFlags';
import { Notification } from './Notification';
import { SerializableContainer } from './Serializable';
import { StackItem } from './StackItems';
import { Transaction } from './transaction';

export const executionLimits = {
  maxShift: 256,
  maxStackSize: 2 * 1024,
  maxItemSize: 1024 * 1024,
  maxInvocationStackSize: 1024,
  maxTryNestingDepth: 16,
};

export interface VMLog {
  readonly containerHash?: UInt256;
  readonly callingScriptHash: UInt160;
  readonly message: string;
  // TODO: add this here and downstream. Make sure it's implemented in VM fork
  // readonly position: number;
}

export interface CallReceipt {
  readonly state: VMState;
  readonly gasConsumed: BN;
  readonly stack: readonly StackItem[];
  readonly notifications: readonly Notification[];
  readonly logs: readonly VMLog[];
}

export type SnapshotName = 'main' | 'clone';

export interface ApplicationEngineOptions {
  readonly trigger: TriggerType;
  readonly container?: SerializableContainer;
  readonly snapshot?: SnapshotName;
  readonly gas: BN;
}

export interface RunEngineOptions {
  readonly script: Buffer;
  readonly snapshot: SnapshotName;
  readonly container?: SerializableContainer;
  readonly persistingBlock?: Block;
  readonly offset?: number;
  readonly gas?: BN;
}

export interface LoadScriptOptions {
  readonly script: Buffer;
  readonly flags?: CallFlags;
  readonly scriptHash?: UInt160;
  readonly initialPosition?: number;
}

export interface LoadContractOptions {
  readonly hash: UInt160;
  readonly flags: CallFlags;
  readonly method: string;
  readonly packParameters?: boolean;
}

export interface ApplicationEngine {
  readonly trigger: TriggerType;
  readonly gasConsumed: BN;
  readonly resultStack: readonly StackItem[];
  readonly state: VMState;
  readonly notifications: readonly StackItem[];
  readonly logs: readonly VMLog[];
  readonly loadScript: (options: LoadScriptOptions) => boolean;
  readonly loadContract: (options: LoadContractOptions) => boolean;
  readonly execute: () => VMState;
}

export type SnapshotPartial = 'blocks' | 'transactions';

export interface SnapshotHandler {
  readonly addBlock: (block: Block) => boolean;
  readonly addTransaction: (transaction: Transaction, index: number, state?: VMState) => boolean;
  readonly deleteTransaction: (hash: UInt256) => boolean;
  readonly commit: (partial?: SnapshotPartial) => boolean;
  // readonly reset: () => boolean;
  readonly changeBlockHashIndex: (index: number, hash: UInt256) => boolean;
  readonly changeHeaderHashIndex: (index: number, hash: UInt256) => boolean;
  readonly setPersistingBlock: (block: Block) => boolean;
  readonly hasPersistingBlock: () => boolean;
  // TODO: type the returning changeSet
  // tslint:disable-next-line: no-any
  readonly getChangeSet: () => any;
  readonly clone: () => void;
}

export interface ApplicationExecuted {
  readonly transaction?: Transaction;
  readonly trigger: TriggerType;
  readonly state: VMState;
  readonly gasConsumed: BN;
  readonly stack: readonly StackItem[];
  readonly notifications: readonly Notification[];
  readonly logs: readonly VMLog[];
}

export interface VM {
  readonly updateSnapshots: () => void;
  readonly withApplicationEngine: <T = void>(
    options: ApplicationEngineOptions,
    func: (engine: ApplicationEngine) => T,
  ) => T;

  readonly withSnapshots: <T = void>(
    func: (snapshots: { readonly main: SnapshotHandler; readonly clone: Omit<SnapshotHandler, 'clone'> }) => T,
  ) => T;
  readonly updateStore: (storage: ReadonlyArray<{ readonly key: Buffer; readonly value: Buffer }>) => void;
  // tslint:disable-next-line: no-any
  readonly test: () => any;
}
