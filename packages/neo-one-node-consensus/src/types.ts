import { ConsensusPayload, Transaction } from '@neo-one/node-core';
import { ConsensusContext } from './ConsensusContext';
import { Context } from './context';

export interface Result<TContext extends Context> {
  readonly context: TContext;
  readonly consensusContext?: ConsensusContext;
  readonly timerSeconds?: number;
}
export type Event =
  | { readonly type: 'handlePersistBlock' }
  | { readonly type: 'handleConsensusPayload'; readonly payload: ConsensusPayload }
  | { readonly type: 'handleTransactionReceived'; readonly transaction: Transaction }
  | {
      readonly type: 'timer';
      readonly promise?: { readonly resolve: () => void; readonly reject: (error: Error) => void };
    };
export interface Options {
  readonly privateNet: boolean;
}
