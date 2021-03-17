import { Block, ChangeViewReason, ConsensusContext, Node } from '@neo-one/node-core';
import { requestChangeView, sendPrepareRequest } from './common';
import { InternalOptions } from './Consensus';
import { makeRecovery } from './makePayload';
import { TimerContext } from './TimerContext';
import { Result } from './types';

export const runConsensus = async ({
  context: contextIn,
  node,
  options: { privateKey, privateNet },
  timerContext,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly options: InternalOptions;
  readonly timerContext: TimerContext;
}): Promise<Result> => {
  let context = contextIn;
  if (privateNet) {
    const { context: privateNetContext } = await sendPrepareRequest({
      node,
      privateKey,
      context,
    });

    return { context: privateNetContext, timerMS: node.blockchain.settings.millisecondsPerBlock };
  }
  if (context.watchOnly || context.blockSent) {
    return { context };
  }

  if (context.isPrimary && !context.requestSentOrReceived) {
    const { context: sendPrepareRequestContext } = await sendPrepareRequest({
      node,
      privateKey,
      context,
    });

    context = sendPrepareRequestContext;
  } else if ((context.isPrimary && context.requestSentOrReceived) || context.isBackup) {
    if (context.commitSent) {
      const recoveryPayload = await makeRecovery({ node, context, privateKey });
      node.relayConsensusPayload(recoveryPayload);
    } else {
      let block: Block | undefined;
      try {
        block = context.blockBuilder.getBlock();
      } catch {
        // do nothing;
      }

      const reason =
        block !== undefined && (context.transactionHashes?.length ?? 0) > Object.values(context.transactions).length
          ? ChangeViewReason.TxNotFound
          : ChangeViewReason.Timeout;

      const { context: requestChangeViewContext } = await requestChangeView({
        node,
        context,
        timerContext,
        privateKey,
        reason,
        isRecovering: false,
      });

      context = requestChangeViewContext;
    }
  }

  return { context };
};
