import { ConsensusContext, ConsensusPayload, Transaction } from '@neo-one/node-core';
import { TimerContext } from './TimerContext';

export interface Result {
  readonly context: ConsensusContext;
  readonly timerContext?: TimerContext;
  readonly timerMS?: number;
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
