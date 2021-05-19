import { common, PrivateKey } from '@neo-one/client-common';
import { ChangeViewReason, ConsensusContext, Node } from '@neo-one/node-core';
import { requestChangeView } from './common';
import { createBlock, getExpectedBlockSize, getExpectedBlockSystemFee } from './context';
import { makeCommit, makePrepareResponse } from './makePayload';
import { TimerContext } from './TimerContext';
import { Result } from './types';

export const checkCommits = async (contextIn: ConsensusContext, node: Node) => {
  let context = contextIn;
  if (
    context.commitPayloads.filter((p) => p !== undefined && context.getMessage(p).viewNumber === context.viewNumber)
      .length >= context.M &&
    context.transactionHashes?.every((hash) => context.transactions[common.uInt256ToHex(hash)] !== undefined)
  ) {
    const { native, storage, headerCache } = node.blockchain.verifyOptions;
    const { context: newContext, block } = await createBlock({
      context,
      native,
      storage,
      headerCache,
      network: node.blockchain.settings.network,
    });
    context = newContext;
    await node.relayBlock(block);
  }

  return context;
};

export const checkPreparations = async (contextIn: ConsensusContext, node: Node, privateKey: PrivateKey) => {
  let context = contextIn;
  if (
    context.preparationPayloads.filter((p) => p !== undefined).length >= context.M &&
    context.transactionHashes?.every((hash) => context.transactions[common.uInt256ToHex(hash)] !== undefined)
  ) {
    const { context: newContext, payload } = await makeCommit({ context, node, privateKey });
    context = newContext;

    // TODO: find out if we need to be doing this
    // await saveContext(context);
    node.relayConsensusPayload(payload);
    await checkCommits(context, node);
  }

  return { context };
};

export const checkPrepareResponse = async ({
  context: contextIn,
  node,
  privateKey,
  timerContext,
  isRecovering,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly timerContext: TimerContext;
  readonly isRecovering: boolean;
}): Promise<Result> => {
  let context = contextIn;
  if (Object.keys(context.transactions).length === context.transactionHashes?.length) {
    if (context.isPrimary || context.watchOnly) {
      return { context };
    }

    const maxBlockSize = node.blockchain.settings.maxBlockSize;
    const maxSystemFee = node.blockchain.settings.maxBlockSystemFee;

    if (getExpectedBlockSize(context) > maxBlockSize) {
      return requestChangeView({
        node,
        privateKey,
        context,
        timerContext,
        reason: ChangeViewReason.BlockRejectedByPolicy,
        isRecovering,
      });
    }

    if (getExpectedBlockSystemFee(context) > maxSystemFee) {
      return requestChangeView({
        node,
        privateKey,
        context,
        timerContext,
        reason: ChangeViewReason.BlockRejectedByPolicy,
        isRecovering,
      });
    }

    const { context: newContext, payload } = await makePrepareResponse({ context, node, privateKey });
    context = newContext;
    node.relayConsensusPayload(payload);

    const { context: preparationsContext } = await checkPreparations(context, node, privateKey);
    context = preparationsContext;
  }

  return { context };
};
