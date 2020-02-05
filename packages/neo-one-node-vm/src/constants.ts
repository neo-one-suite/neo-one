import { common, OpCode, SysCallName, UInt160, VMState } from '@neo-one/client-common';
import { Block, ExecutionAction, ScriptContainer, TriggerType, VMListeners, WriteBlockchain } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { StackItem } from './stackItem';

export const MAX_SHL_SHR = 65535;
export const MIN_SHL_SHR = -MAX_SHL_SHR;
export const MAX_SIZE_BIG_INTEGER = 32;
export const MAX_STACK_SIZE = 2 * 1024;
export const MAX_ITEM_SIZE = 1024 * 1024;
export const MAX_MANIFEST_LENGTH = 2048;
export const MAX_INVOCATION_STACK_SIZE = 1024;
export const MAX_ARRAY_SIZE = 1024;
export const MAX_ARRAY_SIZE_BN = new BN(1024);
export const BLOCK_HEIGHT_YEAR = 2000000;
export const BLOCK_HEIGHT_MAX_SIZE_CHECKS = Number.MAX_SAFE_INTEGER;
export const MAX_PAYLOAD_SIZE = new BN(0x02000000);
export const GAS_PER_BYTE = new BN(100000);

export const FEES = {
  0: new BN(0),
  30: new BN(30),
  40: new BN(40),
  60: new BN(60),
  70: new BN(70),
  100: new BN(100),
  120: new BN(120),
  150: new BN(150),
  180: new BN(180),
  200: new BN(200),
  250: new BN(250),
  300: new BN(300),
  400: new BN(400),
  500: new BN(500),
  7_000: new BN(7000),
  10_000: new BN(10000),
  13_000: new BN(13000),
  15_000: new BN(15000),
  22_000: new BN(22000),
  30_000: new BN(30000),
  70_000: new BN(70000),
  80_000: new BN(80000),
  100_000: new BN(100000),
  110_000: new BN(110000),
  270_000: new BN(270000),
  300_000: new BN(300000),
  500_000: new BN(500000),
  1_000_000: new BN(1000000),
  2_500_000: new BN(2500000),
  3_000_000: new BN(3000000),
  8_000_000: new BN(8000000),
};

export const FREE_GAS = common.TEN_FIXED8;
export type ExecutionStack = readonly StackItem[];
export interface ExecutionInit {
  readonly scriptContainer: ScriptContainer;
  readonly triggerType: TriggerType;
  readonly action: ExecutionAction;
  readonly listeners: VMListeners;
  readonly skipWitnessVerify: boolean;
  readonly persistingBlock?: Block;
}

export interface CreatedContracts {
  readonly [hash: string]: UInt160;
}
export type InvocationCounter = Record<string, number | undefined>;

export interface VMNotification {
  readonly scriptHash: UInt160;
  readonly args: StackItem;
}

export interface Options {
  readonly depth: number;
  readonly stack: ExecutionStack;
  readonly stackAlt: ExecutionStack;
  readonly createdContracts: CreatedContracts;
  readonly scriptHashStack: readonly UInt160[];
  readonly scriptHash: UInt160 | undefined;
  readonly entryScriptHash: UInt160;
  readonly returnValueCount: number;
  readonly stackCount: number;
  readonly notifications: readonly VMNotification[];
  readonly invocationCounter: InvocationCounter;
  readonly pc?: number;
}
export interface ExecutionContext {
  readonly state: VMState;
  readonly errorMessage?: string;
  readonly blockchain: WriteBlockchain;
  readonly init: ExecutionInit;
  readonly engine: {
    readonly run: (input: { readonly context: ExecutionContext }) => Promise<ExecutionContext>;
    readonly executeScript: (input: {
      readonly code: Buffer;
      readonly blockchain: WriteBlockchain;
      readonly init: ExecutionInit;
      readonly gasLeft: BN;
      readonly options?: Options;
    }) => Promise<ExecutionContext>;
  };
  readonly notifications: readonly VMNotification[];
  readonly code: Buffer;
  readonly scriptHashStack: readonly UInt160[];
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
  readonly stackCount: number;
  readonly invocationCounter: InvocationCounter;
}

export interface OpResult {
  readonly context: ExecutionContext;
  readonly results?: readonly StackItem[];
  readonly resultsAlt?: readonly StackItem[];
}
export interface OpInvokeArgs {
  readonly context: ExecutionContext;
  readonly args: readonly StackItem[];
  readonly argsAlt: readonly StackItem[];
}
export type OpInvoke = (input: OpInvokeArgs) => Promise<OpResult> | OpResult;
export interface Op {
  readonly name: OpCode;
  readonly in: number;
  readonly inAlt: number;
  readonly out: number;
  readonly outAlt: number;
  readonly invocation: number;
  readonly fee: BN;
  readonly invoke: OpInvoke;
}
export interface SysCall {
  readonly name: SysCallName;
  readonly in: number;
  readonly inAlt: number;
  readonly out: number;
  readonly outAlt: number;
  readonly invocation: number;
  readonly fee: BN;
  readonly invoke: OpInvoke;
  readonly context: ExecutionContext;
}
