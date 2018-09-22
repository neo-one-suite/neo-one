import { common, OpCode, SysCallName, UInt160, VMState } from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import { Block, ExecutionAction, ScriptContainer, TriggerType, VMListeners, WriteBlockchain } from '@neo-one/node-core';
import BN from 'bn.js';
import { StackItem } from './stackItem';

export const MAX_STACK_SIZE = 2 * 1024;
export const MAX_INVOCATION_STACK_SIZE = 1024;
export const MAX_ARRAY_SIZE = 1024;
export const MAX_ITEM_SIZE = 1024 * 1024;
export const MAX_SCRIPT_LENGTH = 1024 * 1024;
export const MAX_VOTES = 1024;
export const BLOCK_HEIGHT_YEAR = 2000000;
export const MAX_ASSET_NAME_LENGTH = 1024;
const ratio = 100000;
export const FEES = {
  ONE: new BN(ratio * 1),
  TEN: new BN(ratio * 10),
  TWENTY: new BN(ratio * 20),
  ONE_HUNDRED: new BN(ratio * 100),
  TWO_HUNDRED: new BN(ratio * 200),
  FOUR_HUNDRED: new BN(ratio * 400),
  FIVE_HUNDRED: new BN(ratio * 500),
  ONE_THOUSAND: new BN(ratio * 1000),
};

export const FREE_GAS = common.TEN_FIXED8;
export type ExecutionStack = ReadonlyArray<StackItem>;
export interface ExecutionInit {
  readonly scriptContainer: ScriptContainer;
  readonly triggerType: TriggerType;
  readonly action: ExecutionAction;
  readonly listeners: VMListeners;
  readonly skipWitnessVerify: boolean;
  readonly persistingBlock?: Block;
}

interface CreatedContracts {
  readonly [hash: string]: UInt160;
}
export interface Options {
  readonly depth: number;
  readonly stack: ExecutionStack;
  readonly stackAlt: ExecutionStack;
  readonly createdContracts: CreatedContracts;
  readonly scriptHash: UInt160 | undefined;
  readonly entryScriptHash: UInt160;
  readonly returnValueCount: number;
  readonly callerStackCount: number;
  readonly callerStackAltCount: number;
  readonly pc?: number;
}
export interface ExecutionContext {
  readonly state: VMState;
  readonly errorMessage?: string;
  readonly blockchain: WriteBlockchain;
  readonly init: ExecutionInit;
  readonly engine: {
    readonly run: (
      input: { readonly monitor: Monitor; readonly context: ExecutionContext },
    ) => Promise<ExecutionContext>;
    readonly executeScript: (
      input: {
        readonly monitor: Monitor;
        readonly code: Buffer;
        readonly blockchain: WriteBlockchain;
        readonly init: ExecutionInit;
        readonly gasLeft: BN;
        readonly options?: Options;
      },
    ) => Promise<ExecutionContext>;
  };
  readonly code: Buffer;
  readonly scriptHash: UInt160;
  readonly callingScriptHash: UInt160 | undefined;
  readonly entryScriptHash: UInt160;
  readonly pc: number;
  readonly depth: number;
  readonly stack: ExecutionStack;
  readonly stackAlt: ExecutionStack;
  readonly gasLeft: BN;
  readonly createdContracts: CreatedContracts;
  readonly returnValueCount: number;
  readonly callerStackCount: number;
  readonly callerStackAltCount: number;
}

export const getResultContext = (context: ExecutionContext) => ({
  stack: context.stack,
  stackAlt: context.stackAlt,
  gasLeft: context.gasLeft,
  createdContracts: context.createdContracts,
});
export interface OpResult {
  readonly context: ExecutionContext;
  readonly results?: ReadonlyArray<StackItem>;
  readonly resultsAlt?: ReadonlyArray<StackItem>;
}
export interface OpInvokeArgs {
  readonly monitor: Monitor;
  readonly context: ExecutionContext;
  readonly args: ReadonlyArray<StackItem>;
  readonly argsAlt: ReadonlyArray<StackItem>;
}
export type OpInvoke = (input: OpInvokeArgs) => Promise<OpResult> | OpResult;
export interface Op {
  readonly name: OpCode;
  readonly in: number;
  readonly inAlt: number;
  readonly out: number;
  readonly outAlt: number;
  readonly modify: number;
  readonly modifyAlt: number;
  readonly invocation: number;
  readonly array: number;
  readonly item: number;
  readonly fee: BN;
  readonly invoke: OpInvoke;
}
export interface SysCall {
  readonly name: SysCallName;
  readonly in: number;
  readonly inAlt: number;
  readonly out: number;
  readonly outAlt: number;
  readonly modify: number;
  readonly modifyAlt: number;
  readonly invocation: number;
  readonly array: number;
  readonly item: number;
  readonly fee: BN;
  readonly invoke: OpInvoke;
  readonly context: ExecutionContext;
}
