/*
 * not sure if these are new types because of neo3 changes or if we simply implement them differently
 * either way we'll define the missing / different ones here for now and correct later
 */

// tslint:disable no-any
import { TriggerType } from '@neo-one/node-core';

export enum CallFlags {
  None = 0,
  AllowStates = 0b00000001,
  AllowModifyStates = 0b00000010,
  AllowCall = 0b00000100,
  AllowNotify = 0b00001000,
  // tslint:disable-next-line: no-bitwise
  ReadOnly = AllowStates | AllowCall | AllowNotify,
  // tslint:disable-next-line: no-bitwise
  All = AllowStates | AllowModifyStates | AllowCall | AllowNotify,
}

export interface EngineOptions {
  readonly trigger: TriggerType;
  readonly container?: Verifiable;
  readonly snapshot?: boolean;
  readonly gas: Gas;
  readonly testMode?: boolean;
}

// needs to be implemented
export type Verifiable = undefined;

// needs to be implemented
export type StoreView = any | undefined;

// needs to be implemented with BigNumber probably
export type Gas = number;

// needs to be typed on our end
export type ExecutionContext = any;
