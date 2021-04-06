import { CallFlags, TriggerType, UInt160Hex, VMState } from '@neo-one/client-common';
import {
  LoadContractOptions,
  PushArgs,
  SerializedScriptContainer,
  SnapshotName,
  VMProtocolSettingsIn,
} from '@neo-one/node-core';
import { LogReturn, StackItemReturn } from '../converters';
import { DefaultMethods, DispatchMethod } from '../types';

interface CreateEngineArgs {
  readonly trigger: TriggerType;
  readonly container?: SerializedScriptContainer;
  readonly gas: string;
  readonly persistingBlock?: Buffer;
  readonly snapshot?: SnapshotName;
  readonly settings: VMProtocolSettingsIn;
}

interface LoadScriptVMArgs {
  readonly script: Buffer;
  readonly rvcount?: number;
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
  readonly getfaultexception: DispatchMethod<string | undefined>;
  // methods
  readonly execute: DispatchMethod<keyof typeof VMState>;
  readonly loadscript: DispatchMethod<boolean, LoadScriptVMArgs>;
  readonly loadcontract: DispatchMethod<boolean, LoadContractOptions>;
  readonly push: DispatchMethod<boolean, PushArgs>;
}
