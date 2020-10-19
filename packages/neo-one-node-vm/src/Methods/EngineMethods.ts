import { VMState } from '@neo-one/client-common';
import { CallFlags, SerializedScriptContainer, SnapshotName, TriggerType } from '@neo-one/node-core';
import { StackItemReturn } from '../converters';
import { DefaultMethods, DispatchMethod } from '../types';

interface CreateEngineArgs {
  readonly trigger: TriggerType;
  readonly container?: SerializedScriptContainer;
  readonly gas: string;
  readonly snapshot?: SnapshotName;
  readonly testMode: boolean;
}

export interface EngineMethods extends DefaultMethods {
  // constructor
  readonly create: DispatchMethod<boolean, CreateEngineArgs>;
  // getters
  readonly gettrigger: DispatchMethod<keyof typeof TriggerType>;
  readonly getgasconsumed: DispatchMethod<number>;
  readonly getvmstate: DispatchMethod<keyof typeof VMState>;
  readonly getresultstack: DispatchMethod<readonly StackItemReturn[]>;
  readonly getnotifications: DispatchMethod<readonly StackItemReturn[]>;
  // methods
  readonly execute: DispatchMethod<keyof typeof VMState>;
  readonly setinstructionpointer: DispatchMethod<boolean, { readonly position: number }>;
  readonly loadscript: DispatchMethod<boolean, { readonly script: Buffer; readonly flag: CallFlags }>;
}
