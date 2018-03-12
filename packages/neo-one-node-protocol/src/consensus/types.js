/* @flow */
import type { ConsensusPayload, Transaction } from '@neo-one/client-core';

import type { Context } from './context';
import type ConsensusContext from './ConsensusContext';

export type Result<+TContext: Context> = {|
  +context: TContext,
  consensusContext?: ConsensusContext,
  timerSeconds?: number,
|};

export type Event =
  | {| type: 'handlePersistBlock' |}
  | {| type: 'handleConsensusPayload', payload: ConsensusPayload |}
  | {| type: 'handleTransactionReceived', transaction: Transaction |}
  | {| type: 'timer' |};

export type Options = {|
  privateNet: boolean,
|};
