import { VerifyResultModel } from '@neo-one/client-common';
import { Block } from './Block';
import { Blockchain } from './Blockchain';
import { ContractParametersContext } from './ContractParametersContext';
import { Endpoint } from './network';
import { ConsensusPayload } from './payload';
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

// TODO: we can make this `VerifyResultModel` into `VerifyTransactionResult` and add more info like 2.7 later.
export interface RelayTransactionResult {
  readonly verifyResult?: VerifyResultModel;
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
    options?: { readonly throwVerifyError?: boolean; readonly forceAdd?: boolean },
  ) => Promise<RelayTransactionResult>;
  readonly relayConsensusPayload: (payload: ConsensusPayload) => void;
  readonly relayBlock: (block: Block) => Promise<void>;
  readonly connectedPeers: readonly Endpoint[];
  readonly memPool: { readonly [hash: string]: Transaction };
  readonly syncMemPool: () => void;
  readonly consensus: Consensus | undefined;
  readonly reset: () => Promise<void>;
  readonly getNewVerificationContext: () => TransactionVerificationContext;
}
