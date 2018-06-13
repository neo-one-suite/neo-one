/* @flow */
import type { Transaction, UInt256Hex } from '@neo-one/client-core';
import type { Endpoint } from './Network';

export type Consensus = {
  runConsensusNow(): Promise<void>,
  fastForwardOffset(seconds: number): Promise<void>,
  fastForwardToTime(seconds: number): Promise<void>,
  nowSeconds(): number,
  pause(): Promise<void>,
  resume(): Promise<void>,
};

export interface Node {
  relayTransaction(
    transaction: Transaction,
    throwVerifyError?: boolean,
  ): Promise<void>;
  +connectedPeers: Array<Endpoint>;
  +memPool: { [hash: UInt256Hex]: Transaction };
  +consensus: ?Consensus;
}
