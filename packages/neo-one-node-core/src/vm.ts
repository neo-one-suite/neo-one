import { SerializableWire, UInt160, UInt256, VMState } from '@neo-one/client-common';
import { Block } from './Block';
import { CallFlags } from './CallFlags';
import { StackItem } from './StackItems';
import { Transaction } from './transaction';
import { Verifiable } from './Verifiable';

export enum TriggerType {
  Verification = 0x00,
  System = 0x01,
  Application = 0x10,
}

export interface Notification {
  readonly scriptContainer: Buffer;
  readonly scriptHash: UInt160;
  readonly eventName: string;
  readonly state: readonly StackItem[];
}

export interface CallReceipt {
  readonly state: keyof typeof VMState;
  readonly gasConsumed: number;
  readonly stack: readonly StackItem[];
  readonly notifications: readonly Notification[];
}

export type SnapshotName = 'main' | 'clone';

export interface ApplicationEngineOptions {
  readonly trigger: TriggerType;
  readonly container?: Verifiable & SerializableWire;
  readonly snapshot?: SnapshotName;
  readonly gas: number;
  readonly testMode: boolean;
}

export interface ApplicationEngine {
  readonly trigger: keyof typeof TriggerType;
  readonly gasConsumed: number;
  readonly resultStack: readonly StackItem[];
  readonly state: keyof typeof VMState;
  readonly notifications: readonly Notification[];
  readonly loadScript: (script: Buffer, flag?: CallFlags) => boolean;
  readonly execute: () => keyof typeof VMState;
  readonly loadClonedContext: (position: number) => boolean;
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
  // TODO: type the returning changeSet
  readonly getChangeSet: () => any;
  readonly clone: () => void;
}

export interface ApplicationExecuted {
  readonly transaction?: Transaction;
  readonly trigger: keyof typeof TriggerType;
  readonly state: keyof typeof VMState;
  readonly gasConsumed: number;
  readonly stack: readonly StackItem[];
  // readonly notifications: readonly Notification[];
}

export interface VM {
  readonly withApplicationEngine: <T = void>(
    options: ApplicationEngineOptions,
    func: (engine: ApplicationEngine) => T,
  ) => T;

  readonly withSnapshots: <T = void>(
    func: (snapshots: { readonly main: SnapshotHandler; readonly clone: Omit<SnapshotHandler, 'clone'> }) => T,
  ) => T;
}
