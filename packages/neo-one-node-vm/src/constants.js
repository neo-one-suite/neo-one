/* @flow */
import BN from 'bn.js';
import {
  type ExecutionAction,
  type TriggerType,
  type VMListeners,
  type WriteBlockchain,
} from '@neo-one/node-core';
import {
  type Block,
  type OpCode,
  type ScriptContainer,
  type SysCallName,
  type UInt160,
  type UInt160Hex,
  type VMState,
  common,
} from '@neo-one/client-core';
import type { Monitor } from '@neo-one/monitor';

import type { StackItem } from './stackItem';

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
  ONE: new BN(1 * ratio),
  TEN: new BN(10 * ratio),
  TWENTY: new BN(20 * ratio),
  ONE_HUNDRED: new BN(100 * ratio),
  TWO_HUNDRED: new BN(200 * ratio),
  FOUR_HUNDRED: new BN(400 * ratio),
  FIVE_HUNDRED: new BN(500 * ratio),
  ONE_THOUSAND: new BN(1000 * ratio),
};
export const FREE_GAS = common.TEN_FIXED8;

export type ExecutionStack = Array<StackItem>;
export type ExecutionInit = {|
  scriptContainer: ScriptContainer,
  triggerType: TriggerType,
  action: ExecutionAction,
  listeners: VMListeners,
  skipWitnessVerify: boolean,
  persistingBlock?: Block,
|};
type CreatedContracts = { [hash: UInt160Hex]: UInt160 };
export type Options = {|
  depth: number,
  stack: ExecutionStack,
  stackAlt: ExecutionStack,
  actionIndex: number,
  createdContracts: CreatedContracts,
  scriptHash: ?UInt160,
  entryScriptHash: UInt160,
|};
export type ExecutionContext = {|
  state: VMState,
  errorMessage?: string,
  blockchain: WriteBlockchain,
  init: ExecutionInit,
  engine: {
    run: (input: {| monitor: Monitor, context: ExecutionContext |}) => Promise<
      ExecutionContext,
    >,
    executeScript: (input: {|
      monitor: Monitor,
      code: Buffer,
      pushOnly?: boolean,
      blockchain: WriteBlockchain,
      init: ExecutionInit,
      gasLeft: BN,
      options?: Options,
    |}) => Promise<ExecutionContext>,
  },
  code: Buffer,
  pushOnly: boolean,
  scriptHash: UInt160,
  callingScriptHash: ?UInt160,
  entryScriptHash: UInt160,
  pc: number,
  depth: number,
  stack: ExecutionStack,
  stackAlt: ExecutionStack,
  gasLeft: BN,
  actionIndex: number,
  createdContracts: CreatedContracts,
|};

export type OpResult = {|
  context: ExecutionContext,
  results?: Array<StackItem>,
  resultsAlt?: Array<StackItem>,
|};
export type OpInvokeArgs = {|
  monitor: Monitor,
  context: ExecutionContext,
  args: Array<StackItem>,
  argsAlt: Array<StackItem>,
|};
export type OpInvoke = (input: OpInvokeArgs) => Promise<OpResult> | OpResult;
export type Op = {|
  name: OpCode,
  in: number,
  inAlt: number,
  out: number,
  outAlt: number,
  modify: number,
  modifyAlt: number,
  invocation: number,
  array: number,
  item: number,
  fee: BN,
  invoke: OpInvoke,
  context: ExecutionContext,
|};

export type SysCall = {|
  name: SysCallName,
  in: number,
  inAlt: number,
  out: number,
  outAlt: number,
  modify: number,
  modifyAlt: number,
  invocation: number,
  array: number,
  item: number,
  fee: BN,
  invoke: OpInvoke,
  context: ExecutionContext,
|};
