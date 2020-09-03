import { SerializableWire, UInt256, VMState } from '@neo-one/client-common';
import { Block } from './Block';
import { StackItem } from './StackItems';
import { ChangeSet } from './Storage';
import { Transaction } from './transaction';
import { Verifiable } from './Verifiable';

export enum TriggerType {
  Verification = 0x00,
  System = 0x01,
  Application = 0x10,
}

export type SnapshotName = 'main' | 'clone';

export interface ApplicationEngineOptions {
  readonly trigger: TriggerType;
  readonly container?: Verifiable & SerializableWire;
  readonly snapshot?: SnapshotName;
  readonly gas: number;
  readonly testMode?: boolean;
}

export interface ApplicationEngine {
  readonly trigger: TriggerType;
  readonly gasConsumed: number;
  readonly resultStack: readonly StackItem[];
  readonly state: VMState;
  readonly loadScript: (script: Buffer) => boolean;
  readonly execute: () => keyof typeof VMState;
  readonly loadClonedContext: (position: number) => boolean;
}

export type SnapshotPartial = 'blocks' | 'transactions';

export interface SnapshotHandler {
  readonly addBlock: (block: Block) => boolean;
  readonly addTransaction: (transaction: Transaction, index: number, state?: VMState) => boolean;
  readonly deleteTransaction: (hash: UInt256) => boolean;
  readonly commit: (partial?: SnapshotPartial) => boolean;
  readonly reset: () => boolean;
  readonly changeBlockHashIndex: (index: number, hash: UInt256) => boolean;
  readonly changeHeaderHashIndex: (index: number, hash: UInt256) => boolean;
  readonly setPersistingBlock: (block: Block) => boolean;
  readonly getChangeSet: () => any;
  readonly clone: () => void;
}

// tslint:disable-next-line no-any TODO: implement
export type Notification = any;

export interface ApplicationExecuted {
  readonly transaction?: Transaction;
  readonly trigger: TriggerType;
  readonly state: VMState;
  readonly gasConsumed: number;
  readonly stack: readonly StackItem[];
  readonly notifications: readonly Notification[];
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
