import { TriggerType, UInt256, VMState, Log, UInt160 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Block } from './Block';
import { CallFlags } from './CallFlags';
import { Notification } from './Notification';
import { SerializableContainer } from './Serializable';
import { StackItem } from './StackItems';
import { Transaction } from './transaction';

export interface VMLog {
  readonly containerHash?: UInt256;
  readonly callingScriptHash: UInt160;
  readonly message: string;
  readonly position: number;
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
  readonly testMode: boolean;
}

export interface RunEngineOptions {
  readonly script: Buffer;
  readonly snapshot: SnapshotName;
  readonly container?: SerializableContainer;
  readonly persistingBlock?: Block;
  readonly offset?: number;
  readonly testMode?: boolean;
  readonly gas?: BN;
}

export interface ApplicationEngine {
  readonly trigger: TriggerType;
  readonly gasConsumed: BN;
  readonly resultStack: readonly StackItem[];
  readonly state: VMState;
  readonly notifications: readonly StackItem[];
  readonly logs: readonly VMLog[];
  readonly loadScript: (script: Buffer, flag?: CallFlags) => boolean;
  readonly execute: () => VMState;
  readonly setInstructionPointer: (position: number) => boolean;
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
  readonly updateStore: (storage: ReadonlyArray<{ key: Buffer; value: Buffer }>) => void;
}
