/* @flow */
import type BN from 'bn.js';
import {
  type Block,
  type ContractParameter,
  type ECPoint,
  type OpCode,
  type ScriptContainer,
  type UInt160,
  type UInt256,
  type VMState,
  common,
} from '@neo-one/client-core';

import type { WriteBlockchain } from './Blockchain';

export const TRIGGER_TYPE = {
  VERIFICATION: 0x00,
  APPLICATION: 0x10,
};

export type TriggerType =
  | 0x00 // Verification
  | 0x10; // Application

export type Script = {|
  code: Buffer,
  pushOnly?: boolean,
|};
export const NULL_ACTION = {
  blockIndex: -1,
  blockHash: common.ZERO_UINT256,
  transactionIndex: -1,
  transactionHash: common.ZERO_UINT256,
};
export type ExecutionAction = {|
  blockIndex: number,
  blockHash: UInt256,
  transactionIndex: number,
  transactionHash: UInt256,
|};
export type ExecuteScriptsResult = {|
  state: VMState,
  stack: Array<ContractParameter>,
  stackAlt: Array<ContractParameter>,
  gasConsumed: BN,
  errorMessage?: string,
|};
export type VMContext = {|
  script: Script,
  scriptHash: UInt160,
  pc: number,
  depth: number,
  stack: Array<ContractParameter>,
  stackAlt: Array<ContractParameter>,
  state: VMState,
  gasLeft: BN,
|};
export type OnStepInput = {| context: VMContext, opCode: OpCode |};
export type OnStep = (input: OnStepInput) => void;
export type VMListeners = {|
  onMigrateContract?: (options: {| from: UInt160, to: UInt160 |}) => void,
  onSetVotes?: (options: {| address: UInt160, votes: Array<ECPoint> |}) => void,
|};
export type ExecuteScripts = (input: {|
  scripts: Array<Script>,
  blockchain: WriteBlockchain,
  scriptContainer: ScriptContainer,
  triggerType: TriggerType,
  action: ExecutionAction,
  gas: BN,
  // eslint-disable-next-line
  onStep?: OnStep,
  listeners?: VMListeners,
  skipWitnessVerify?: boolean,
  persistingBlock?: Block,
|}) => Promise<ExecuteScriptsResult>;

export type VM = {|
  executeScripts: ExecuteScripts,
|};
