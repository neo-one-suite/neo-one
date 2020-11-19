import { PrivateKey } from '@neo-one/client-common';
import { ConsensusContext, Node, Transaction } from '@neo-one/node-core';
import { addTransaction } from './common';
import { TimerContext } from './TimerContext';
import { Result } from './types';

export const handleTransactionReceived = async ({
  context,
  node,
  privateKey,
  transaction,
  timerContext,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly transaction: Transaction;
  readonly timerContext: TimerContext;
}): Promise<Result> => {
  if (
    !context.isBackup ||
    context.notAcceptingPayloadsDueToViewChanging ||
    !context.requestSentOrReceived ||
    context.responseSent ||
    context.blockSent ||
    context.transactions[transaction.hashHex] !== undefined ||
    !context.transactionHashesSet.has(transaction.hashHex)
  ) {
    return { context };
  }

  return addTransaction({
    context,
    node,
    privateKey,
    transaction,
    verify: true,
    timerContext,
    isRecovering: false,
  });
};
