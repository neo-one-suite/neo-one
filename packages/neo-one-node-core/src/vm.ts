import { CallFlags, TriggerType, UInt160, UInt256, VMState } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Action } from './action';
import { Block } from './Block';
import { ExecutionResult } from './executionResult';
import { Notification } from './Notification';
import { SerializableContainer } from './Serializable';
import { VMProtocolSettingsIn } from './Settings';
import { StackItem } from './StackItems';
import { Batch } from './Storage';
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
  readonly position: number;
}

export interface CallReceipt {
  readonly result: ExecutionResult;
  readonly actions: readonly Action[];
}

export interface RunEngineResult {
  readonly state: VMState;
  readonly gasConsumed: BN;
  readonly exception?: string;
  readonly stack: readonly StackItem[];
  readonly notifications: readonly Notification[];
  readonly logs: readonly VMLog[];
}

export type SnapshotName = 'main' | 'clone';

export interface ApplicationEngineOptions {
  readonly trigger: TriggerType;
  readonly container?: SerializableContainer;
  readonly snapshot?: SnapshotName;
  readonly persistingBlock?: Block;
  readonly gas: BN;
  readonly settings: VMProtocolSettingsIn;
}

export interface RunEngineOptions {
  readonly script: Buffer;
  readonly snapshot: SnapshotName;
  readonly rvcount?: number;
  readonly container?: SerializableContainer;
  readonly persistingBlock?: Block;
  readonly offset?: number;
  readonly gas?: BN;
}

export interface LoadScriptOptions {
  readonly script: Buffer;
  readonly rvcount?: number;
  readonly flags?: CallFlags;
  readonly scriptHash?: UInt160;
  readonly initialPosition?: number;
}

export interface LoadContractOptions {
  readonly hash: UInt160;
  readonly flags: CallFlags;
  readonly method: string;
  readonly pcount: number;
}

export interface PushArgs {
  readonly item: string;
}

export interface ApplicationEngine {
  readonly trigger: TriggerType;
  readonly gasConsumed: BN;
  readonly resultStack: readonly StackItem[];
  readonly state: VMState;
  readonly faultException?: string;
  readonly notifications: readonly StackItem[];
  readonly logs: readonly VMLog[];
  readonly loadScript: (options: LoadScriptOptions) => boolean;
  readonly loadContract: (options: LoadContractOptions) => boolean;
  readonly execute: () => VMState;
  readonly push: (item: string) => boolean;
}

export interface SnapshotHandler {
  readonly commit: () => boolean;
  readonly reset: () => boolean;
  // tslint:disable-next-line: readonly-array
  readonly getChangeSet: () => Batch[];
  readonly clone: () => void;
}

export interface ApplicationExecuted {
  readonly transaction?: Transaction;
  readonly trigger: TriggerType;
  readonly state: VMState;
  readonly exception?: string;
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
