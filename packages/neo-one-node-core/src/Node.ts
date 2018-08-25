import { Transaction } from '@neo-one/client-core';
import { Endpoint } from './Network';

export interface Consensus {
  readonly runConsensusNow: () => Promise<void>;
  readonly fastForwardOffset: (seconds: number) => Promise<void>;
  readonly fastForwardToTime: (seconds: number) => Promise<void>;
  readonly nowSeconds: () => number;
  readonly pause: () => Promise<void>;
  readonly reset: () => Promise<void>;
  readonly resume: () => Promise<void>;
}

export interface Node {
  readonly relayTransaction: (
    transaction: Transaction,
    options?: { readonly throwVerifyError?: boolean; readonly forceAdd?: boolean },
  ) => Promise<void>;
  readonly connectedPeers: ReadonlyArray<Endpoint>;
  readonly memPool: { readonly [hash: string]: Transaction };
  readonly consensus: Consensus | undefined;
  readonly reset: () => Promise<void>;
}
