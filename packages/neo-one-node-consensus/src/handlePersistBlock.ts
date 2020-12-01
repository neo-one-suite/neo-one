import { PrivateKey } from '@neo-one/client-common';
import { Blockchain, ConsensusContext } from '@neo-one/node-core';
import { initializeConsensus } from './common';
import { TimerContext } from './TimerContext';
import { Result } from './types';

export const handlePersistBlock = async ({
  blockchain,
  privateKey,
  context: contextIn,
  timerContext,
}: {
  readonly blockchain: Blockchain;
  readonly privateKey: PrivateKey;
  readonly context: ConsensusContext;
  readonly timerContext: TimerContext;
}): Promise<Result> => {
  let context = contextIn;
  const newTime = Date.now();
  context = context.clone({ blockReceivedTimeMS: newTime });

  return initializeConsensus({
    context,
    blockchain,
    privateKey,
    timerContext,
    viewNumber: 0,
    isRecovering: false,
  });
};
