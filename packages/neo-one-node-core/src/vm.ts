import {
  Block,
  common,
  ContractParameter,
  ECPoint,
  ScriptContainer,
  UInt160,
  UInt256,
  VMState,
} from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import BN from 'bn.js';
import { WriteBlockchain } from './Blockchain';

export enum TriggerType {
  Verification = 0x00,
  Application = 0x10,
}

// Application

export interface Script {
  readonly code: Buffer;
}

export const NULL_ACTION = {
  blockIndex: -1,
  blockHash: common.ZERO_UINT256,
  transactionIndex: -1,
  transactionHash: common.ZERO_UINT256,
};

export interface ExecutionAction {
  readonly blockIndex: number;
  readonly blockHash: UInt256;
  readonly transactionIndex: number;
  readonly transactionHash: UInt256;
}

export interface ExecuteScriptsResult {
  readonly state: VMState;
  readonly stack: ReadonlyArray<ContractParameter>;
  readonly stackAlt: ReadonlyArray<ContractParameter>;
  readonly gasConsumed: BN;
  readonly gasCost: BN;
  readonly errorMessage?: string;
}

export interface VMListeners {
  readonly onNotify?: (
    options: {
      readonly args: ReadonlyArray<ContractParameter>;
      readonly scriptHash: UInt160;
    },
  ) => void;

  readonly onLog?: (options: { readonly message: string; readonly scriptHash: UInt160 }) => void;
  readonly onMigrateContract?: (options: { readonly from: UInt160; readonly to: UInt160 }) => void;
  readonly onSetVotes?: (options: { readonly address: UInt160; readonly votes: ReadonlyArray<ECPoint> }) => void;
}

export type ExecuteScripts = (
  input: {
    readonly monitor: Monitor;
    readonly scripts: ReadonlyArray<Script>;
    readonly blockchain: WriteBlockchain;
    readonly scriptContainer: ScriptContainer;
    readonly triggerType: TriggerType;
    readonly action: ExecutionAction;
    readonly gas: BN;
    readonly listeners?: VMListeners;
    readonly skipWitnessVerify?: boolean;
    readonly persistingBlock?: Block;
  },
) => Promise<ExecuteScriptsResult>;

export interface VM {
  readonly executeScripts: ExecuteScripts;
}
