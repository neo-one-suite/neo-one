/* @flow */
import type { ConsensusPayload, Transaction } from '@neo-one/core';

import type { Context } from './context';

export type Result<+TContext: Context> = {|
  +context: TContext,
  timerSeconds?: number,
|};

export type Event =
  | {| type: 'handlePersistBlock' |}
  | {| type: 'handleConsensusPayload', payload: ConsensusPayload |}
  | {| type: 'handleTransactionReceived', transaction: Transaction |}
  | {| type: 'timer' |};
