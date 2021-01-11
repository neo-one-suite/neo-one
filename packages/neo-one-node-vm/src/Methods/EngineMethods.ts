import { TriggerType, VMState, UInt160Hex } from '@neo-one/client-common';
import { CallFlags, SerializedScriptContainer, SnapshotName, LoadContractOptions } from '@neo-one/node-core';
import { StackItemReturn, LogReturn } from '../converters';
import { DefaultMethods, DispatchMethod } from '../types';

interface CreateEngineArgs {
  readonly trigger: TriggerType;
  readonly container?: SerializedScriptContainer;
  readonly gas: string;
  readonly snapshot?: SnapshotName;
}

interface LoadScriptVMArgs {
  readonly script: Buffer;
  readonly flags: CallFlags;
  readonly scriptHash?: UInt160Hex;
  readonly initialPosition?: number;
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
  readonly getlogs: DispatchMethod<readonly LogReturn[]>;
  // methods
  readonly execute: DispatchMethod<keyof typeof VMState>;
  readonly loadscript: DispatchMethod<boolean, LoadScriptVMArgs>;
  readonly loadcontract: DispatchMethod<boolean, LoadContractOptions>;
}
