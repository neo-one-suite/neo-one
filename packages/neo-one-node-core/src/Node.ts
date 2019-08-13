import { Block } from './Block';
import { Blockchain, VerifyTransactionResult } from './Blockchain';
import { Endpoint } from './net';
import { ConsensusPayload } from './payload';
import { Transaction } from './transaction';

export interface Consensus {
  readonly runConsensusNow: () => Promise<void>;
  readonly fastForwardOffset: (seconds: number) => Promise<void>;
  readonly fastForwardToTime: (seconds: number) => Promise<void>;
  readonly nowSeconds: () => number;
  readonly pause: () => Promise<void>;
  readonly reset: () => Promise<void>;
  readonly resume: () => Promise<void>;
}

export interface RelayTransactionResult {
  readonly verifyResult?: VerifyTransactionResult;
}

export interface Node {
  readonly blockchain: Blockchain;
  readonly relayTransaction: (
    transaction: Transaction,
    options?: { readonly throwVerifyError?: boolean; readonly forceAdd?: boolean },
  ) => Promise<RelayTransactionResult>;
  readonly relayConsensusPayload: (payload: ConsensusPayload) => void;
  readonly relayBlock: (block: Block) => Promise<void>;
  readonly connectedPeers: readonly Endpoint[];
  readonly memPool: { readonly [hash: string]: Transaction };
  readonly syncMemPool: () => void;
  readonly consensus: Consensus | undefined;
  readonly reset: () => Promise<void>;
}
