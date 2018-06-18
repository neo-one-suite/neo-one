import { Transaction } from '@neo-one/client-core';
import { Endpoint } from './Network';

export interface Consensus {
  readonly runConsensusNow: () => Promise<void>;
  readonly fastForwardOffset: (seconds: number) => Promise<void>;
  readonly fastForwardToTime: (seconds: number) => Promise<void>;
  readonly nowSeconds: () => number;
  readonly pause: () => Promise<void>;
  readonly resume: () => Promise<void>;
}

export interface Node {
  readonly relayTransaction: (transaction: Transaction, throwVerifyError?: boolean) => Promise<void>;
  readonly connectedPeers: ReadonlyArray<Endpoint>;
  readonly memPool: { readonly [hash: string]: Transaction };
  readonly consensus: Consensus | undefined;
}
