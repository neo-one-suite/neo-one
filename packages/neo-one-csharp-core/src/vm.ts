import { VMState } from '@neo-one/client-common';
import { StackItem } from './StackItems';
import { Transaction } from './transaction';
import { Verifiable } from './Verifiable';

export enum TriggerType {
  Verification = 0x00,
  Application = 0x10,
}

export interface ApplicationEngineOptions {
  readonly trigger: TriggerType;
  readonly container?: Verifiable;
  readonly snapshot?: boolean;
  readonly gas: number;
  readonly testMode?: boolean;
}

export interface ApplicationEngine {
  readonly trigger: TriggerType;
  readonly gasConsumed: number;
  readonly resultStack: readonly StackItem[];
  readonly execute: () => keyof typeof VMState;
  readonly loadClonedContext: (position: number) => boolean;
}

// tslint:disable-next-line no-any TODO: implement
export type Notification = any;

export interface ApplicationExecuted {
  readonly transaction?: Transaction;
  readonly trigger: TriggerType;
  readonly state: VMState;
  readonly gasConsumed: number;
  readonly stack: readonly StackItem[];
  readonly notification: readonly Notification[];
}

export interface VM {
  readonly withApplicationEngine: <T = void>(
    options: ApplicationEngineOptions,
    func: (engine: ApplicationEngine) => T,
  ) => T;
}
