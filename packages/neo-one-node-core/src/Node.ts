import { VerifyResultModelExtended } from '@neo-one/client-common';
import { Block } from './Block';
import { Blockchain } from './Blockchain';
import { Endpoint } from './network';
import { ExtensiblePayload } from './payload';
import { Transaction } from './transaction';
import { TransactionVerificationContext } from './TransactionVerificationContext';

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
  readonly verifyResult?: VerifyResultModelExtended;
}

export interface Version {
  readonly tcpPort: number;
  readonly wsPort: number;
  readonly nonce: number;
  readonly useragent: string;
}

export interface Node {
  readonly version: Version;
  readonly blockchain: Blockchain;
  readonly relayTransaction: (
    transaction: Transaction,
    options?: { readonly forceAdd?: boolean },
  ) => Promise<RelayTransactionResult>;
  readonly relayConsensusPayload: (payload: ExtensiblePayload) => void;
  readonly relayBlock: (block: Block) => Promise<void>;
  readonly connectedPeers: readonly Endpoint[];
  readonly memPool: { readonly [hash: string]: Transaction };
  readonly syncMemPool: () => void;
  readonly consensus: Consensus | undefined;
  readonly reset: () => Promise<void>;
  readonly getNewVerificationContext: () => TransactionVerificationContext;
}
