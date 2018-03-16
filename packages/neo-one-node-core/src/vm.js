/* @flow */
import type BN from 'bn.js';
import {
  type Block,
  type ContractParameter,
  type ECPoint,
  type ScriptContainer,
  type UInt160,
  type UInt256,
  type VMState,
  common,
} from '@neo-one/client-core';
import type { Monitor } from '@neo-one/monitor';

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
export type VMListeners = {|
  onMigrateContract?: (options: {| from: UInt160, to: UInt160 |}) => void,
  onSetVotes?: (options: {| address: UInt160, votes: Array<ECPoint> |}) => void,
|};
export type ExecuteScripts = (input: {|
  monitor: Monitor,
  scripts: Array<Script>,
  blockchain: WriteBlockchain,
  scriptContainer: ScriptContainer,
  triggerType: TriggerType,
  action: ExecutionAction,
  gas: BN,
  listeners?: VMListeners,
  skipWitnessVerify?: boolean,
  persistingBlock?: Block,
|}) => Promise<ExecuteScriptsResult>;

export type VM = {|
  executeScripts: ExecuteScripts,
|};
