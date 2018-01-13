/* @flow */
import type { Transaction, UInt256Hex } from '@neo-one/client-core';
import type { Endpoint } from './Network';

export interface Node {
  relayTransaction(transaction: Transaction): Promise<void>;
  +connectedPeers: Array<Endpoint>;
  +memPool: { [hash: UInt256Hex]: Transaction };
}
