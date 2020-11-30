import { PrivateKey } from '@neo-one/client-common';
import { ConsensusContext, Node, Transaction } from '@neo-one/node-core';
import { addTransaction } from './common';
import { TimerContext } from './TimerContext';
import { Result } from './types';

export const handleTransactionReceived = async ({
  context,
  node,
  privateKey,
  privateNet,
  transaction,
  timerContext,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly privateNet: boolean;
  readonly transaction: Transaction;
  readonly timerContext: TimerContext;
}): Promise<Result> => {
  // TODO: temporary workaround for private net development.
  if (privateNet) {
    if (context.blockSent) {
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
  }

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
