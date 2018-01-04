/* @flow */
import type { Transaction, UInt256Hex } from '@neo-one/client-core';

export interface Node {
  relayTransaction(transaction: Transaction): Promise<void>;
  +connectedPeersCount: number;
  +memPool: { [hash: UInt256Hex]: Transaction };
}
