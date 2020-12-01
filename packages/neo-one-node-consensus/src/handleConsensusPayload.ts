import { common, crypto, PrivateKey, UInt256Hex } from '@neo-one/client-common';
import {
  ChangeViewConsensusMessage,
  ChangeViewReason,
  CommitConsensusMessage,
  ConsensusContext,
  ConsensusMessageType,
  ConsensusPayload,
  Node,
  PrepareRequestConsensusMessage,
  PrepareResponseConsensusMessage,
  RecoveryConsensusMessage,
} from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
import _ from 'lodash';
import { checkCommits, checkPreparations, checkPrepareResponse } from './checkPayload';
import { addTransaction, checkExpectedView, initializeConsensus, sendPrepareRequest } from './common';
import { ensureHeader } from './context';
import { makeChangeView, makeRecovery } from './makePayload';
import { TimerContext } from './TimerContext';
import { Result } from './types';

const handleChangeView = async ({
  context: contextIn,
  node,
  knownHashes,
  payload,
  privateKey,
  timerContext,
  message,
  isRecovering,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly knownHashes: Set<UInt256Hex>;
  readonly payload: ConsensusPayload;
  readonly privateKey: PrivateKey;
  readonly timerContext: TimerContext;
  readonly message: ChangeViewConsensusMessage;
  readonly isRecovering: boolean;
}): Promise<Result> => {
  let context = contextIn;
  const viewNumber = message.newViewNumber;

  if (viewNumber <= context.viewNumber) {
    const { context: recoveryContext } = await handleRecoveryRequest({
      context,
      node,
      privateKey,
      payload,
      knownHashes,
    });
    context = recoveryContext;
  }

  if (context.commitSent) {
    return { context };
  }

  const expectedView =
    context.changeViewPayloads[payload.validatorIndex]?.getDeserializedMessage<ChangeViewConsensusMessage>()
      .newViewNumber ?? 0;
  if (viewNumber <= expectedView) {
    return { context };
  }

  const mutableChangeViewPayloads = [...context.changeViewPayloads];
  mutableChangeViewPayloads[payload.validatorIndex] = payload;
  context = context.clone({
    changeViewPayloads: mutableChangeViewPayloads,
  });

  if (checkExpectedView({ context, viewNumber })) {
    if (!context.watchOnly) {
      const viewMessage = context.changeViewPayloads[context.myIndex]?.getDeserializedMessage<
        ChangeViewConsensusMessage
      >();
      // tslint:disable-next-line: strict-type-predicates
      if (viewMessage === undefined || viewMessage.newViewNumber < viewNumber) {
        const { context: changeViewContext, payload: changeViewPayload } = await makeChangeView({
          node,
          context,
          privateKey,
          reason: ChangeViewReason.ChangeAgreement,
        });
        context = changeViewContext;
        node.relayConsensusPayload(changeViewPayload);
      }
    }

    return initializeConsensus({
      blockchain: node.blockchain,
      privateKey,
      context,
      viewNumber,
      timerContext,
      isRecovering,
    });
  }

  return { context };
};

const TEN_MINUTES_IN_MILLISECONDS = 10 * 60 * 1000;

const handlePrepareRequest = async ({
  context: contextIn,
  node,
  privateKey,
  payload,
  timerContext,
  message,
  isRecovering,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly payload: ConsensusPayload;
  readonly timerContext: TimerContext;
  readonly message: PrepareRequestConsensusMessage;
  readonly isRecovering: boolean;
}): Promise<Result> => {
  let context = contextIn;
  if (
    context.requestSentOrReceived ||
    context.notAcceptingPayloadsDueToViewChanging ||
    payload.validatorIndex !== context.blockBuilder.consensusData?.primaryIndex ||
    message.viewNumber !== context.viewNumber ||
    message.timestamp.gtn(timerContext.nowMilliseconds() + TEN_MINUTES_IN_MILLISECONDS)
  ) {
    return { context };
  }
  const header = await node.blockchain.getHeader(commonUtils.nullthrows(context.blockBuilder.previousHash));
  if (header === undefined) {
    return { context };
  }

  if (message.timestamp <= header.timestamp) {
    return { context };
  }

  const maybeStates = await Promise.all(message.transactionHashes.map(node.blockchain.transactions.tryGet));
  if (maybeStates.some((value) => value !== undefined)) {
    return { context };
  }

  const newPreparationPayloads = context.preparationPayloads.map((p) => {
    if (p?.getDeserializedMessage<PrepareResponseConsensusMessage>().preparationHash.equals(payload.hash)) {
      return p;
    }

    return undefined;
  });

  const mutablePreparationPayloads = [...newPreparationPayloads];
  mutablePreparationPayloads[payload.validatorIndex] = payload;

  const tempContextOptions = {
    timestamp: message.timestamp,
    consensusData: {
      nonce: message.nonce,
    },
    transactionHashes: message.transactionHashes,
    transactions: {},
    verificationContext: node.getNewVerificationContext(),
    preparationPayloads: mutablePreparationPayloads,
  };

  const { context: headerContext, block } = ensureHeader(context.clone(tempContextOptions));
  context = headerContext;
  const hashData = block?.getBlock().message;
  if (hashData === undefined) {
    throw new Error('block should have hashData');
  }

  const newCommitPayloads = [...context.commitPayloads].map((p, idx) => {
    if (
      p?.consensusMessage.viewNumber === context.viewNumber &&
      !crypto.verify({
        message: hashData,
        signature: p.getDeserializedMessage<CommitConsensusMessage>().signature,
        publicKey: context.validators[idx],
      })
    ) {
      return undefined;
    }

    return p;
  });

  context = context.clone({ commitPayloads: newCommitPayloads });

  if (context.transactionHashes === undefined) {
    throw new Error('we set this explicitly');
  }

  if (context.transactionHashes?.length === 0) {
    return checkPrepareResponse({
      context,
      node,
      privateKey,
      timerContext,
      isRecovering,
    });
  }

  let nextContext = context;
  // tslint:disable-next-line: no-loop-statement
  for (const hash of context.transactionHashes) {
    const maybeTransaction = node.memPool[common.uInt256ToHex(hash)];
    // tslint:disable-next-line: strict-type-predicates
    if (maybeTransaction !== undefined) {
      try {
        const { context: txContext } = await addTransaction({
          context: nextContext,
          node,
          privateKey,
          transaction: maybeTransaction,
          verify: false,
          timerContext,
          isRecovering,
        });

        nextContext = txContext;
      } catch {
        return { context: nextContext };
      }
    } else {
      throw new Error('yep guess we need to implement the mempool stuff');
    }
  }

  if (Object.values(context.transactions).length < context.transactionHashes.length) {
    throw new Error('is this actually happening tho?');
  }

  node.syncMemPool();

  return { context };
};

const handleCommit = async ({
  context: contextIn,
  node,
  payload,
  commit,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly payload: ConsensusPayload;
  readonly commit: CommitConsensusMessage;
}) => {
  let context = contextIn;
  const idx = payload.validatorIndex;
  const existingCommitPayload = context.commitPayloads[idx];
  if (!existingCommitPayload?.hash.equals(payload.hash)) {
    return { context };
  }

  const mutableExistingCommitPayloads = [...context.commitPayloads];
  if (commit.viewNumber === context.viewNumber) {
    const { context: newContext, block } = ensureHeader(context);
    context = newContext;
    const message = block?.getBlock().message;
    if (message === undefined) {
      mutableExistingCommitPayloads[idx] = payload;
      context = context.clone({ commitPayloads: mutableExistingCommitPayloads });
    } else if (
      crypto.verify({ message, signature: commit.signature, publicKey: context.validators[payload.validatorIndex] })
    ) {
      mutableExistingCommitPayloads[idx] = payload;
      context = context.clone({ commitPayloads: mutableExistingCommitPayloads });
      const checkCommitsContext = await checkCommits(context, node);
      context = checkCommitsContext;
    }

    return { context };
  }

  mutableExistingCommitPayloads[idx] = payload;
  context = context.clone({ commitPayloads: mutableExistingCommitPayloads });

  return { context };
};

const handlePrepareResponse = async ({
  context: contextIn,
  node,
  privateKey,
  payload,
  message,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly payload: ConsensusPayload;
  readonly message: PrepareResponseConsensusMessage;
}): Promise<Result> => {
  let context = contextIn;
  if (
    message.viewNumber !== context.viewNumber ||
    context.preparationPayloads[payload.validatorIndex] !== undefined ||
    context.notAcceptingPayloadsDueToViewChanging
  ) {
    return { context };
  }

  const index = context.blockBuilder.consensusData?.primaryIndex;
  if (index === undefined) {
    return { context };
  }

  const prepPayload = context.preparationPayloads[index];

  if (prepPayload !== undefined && !message.preparationHash.equals(prepPayload.hash)) {
    return { context };
  }

  const mutablePreparationPayloads = [...context.preparationPayloads];
  mutablePreparationPayloads[payload.validatorIndex] = payload;
  context = context.clone({ preparationPayloads: mutablePreparationPayloads });
  if (context.watchOnly || context.commitSent) {
    return { context };
  }

  if (context.requestSentOrReceived) {
    return checkPreparations(context, node, privateKey);
  }

  return { context };
};

const handleRecoveryRequest = async ({
  node,
  privateKey,
  context: contextIn,
  payload,
  knownHashes,
}: {
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly context: ConsensusContext;
  readonly payload: ConsensusPayload;
  readonly knownHashes: Set<UInt256Hex>;
}): Promise<Result> => {
  const context = contextIn;
  if (knownHashes.has(payload.hashHex)) {
    return { context };
  }
  knownHashes.add(payload.hashHex);

  if (context.watchOnly) {
    return { context };
  }

  if (!context.commitSent) {
    const shouldSendRecovery = _.range(1, context.M + 1).some((i) => {
      const chosenIndex = (payload.validatorIndex + i) % context.validators.length;

      return chosenIndex === context.myIndex;
    });

    if (!shouldSendRecovery) {
      return { context };
    }
  }

  const recoveryPayload = await makeRecovery({ context, node, privateKey });

  node.relayConsensusPayload(recoveryPayload);

  return { context };
};

const handleRecoveryMessage = async ({
  node,
  context: contextIn,
  knownHashes,
  privateKey,
  payload,
  message,
  timerContext,
}: {
  readonly node: Node;
  readonly context: ConsensusContext;
  readonly knownHashes: Set<UInt256Hex>;
  readonly privateKey: PrivateKey;
  readonly payload: ConsensusPayload;
  readonly message: RecoveryConsensusMessage;
  readonly timerContext: TimerContext;
}): Promise<Result> => {
  let context = contextIn;
  if (message.viewNumber > context.viewNumber) {
    if (context.commitSent) {
      return { context };
    }

    const changeViewPayloads = message.getChangeViewPayloads(context, payload);
    const { context: postChangeViewsContext } = await reverifyAndProcessPayloads({
      context,
      node,
      knownHashes,
      privateKey,
      payloads: changeViewPayloads,
      timerContext,
    });

    context = postChangeViewsContext;
  }

  if (
    message.viewNumber === context.viewNumber &&
    !context.notAcceptingPayloadsDueToViewChanging &&
    !context.commitSent
  ) {
    if (!context.requestSentOrReceived) {
      const prepareRequestPayload = message.getPrepareRequestPayload(context, payload);
      if (prepareRequestPayload !== undefined) {
        const { context: postPrepareRequestContext } = await reverifyAndProcessPayload({
          context,
          node,
          knownHashes,
          privateKey,
          payload: prepareRequestPayload,
          timerContext,
        });

        context = postPrepareRequestContext;
      } else if (context.isPrimary) {
        const { context: prepareRequestContext } = await sendPrepareRequest({ node, privateKey, context });
        context = prepareRequestContext;
      }
    }

    const prepareResponsePayloads = message.getPrepareResponsePayloads(context, payload);
    const { context: postPrepareResponsesContext } = await reverifyAndProcessPayloads({
      context,
      node,
      knownHashes,
      privateKey,
      payloads: prepareResponsePayloads,
      timerContext,
    });

    context = postPrepareResponsesContext;
  }

  if (message.viewNumber <= context.viewNumber) {
    const commitPayloads = message.getCommitPayloads(context, payload);
    const { context: postCommitsContext } = await reverifyAndProcessPayloads({
      context,
      node,
      knownHashes,
      privateKey,
      payloads: commitPayloads,
      timerContext,
    });

    context = postCommitsContext;
  }

  return { context };
};

interface ReverifyPayloadResult {
  readonly context: ConsensusContext;
  readonly verified: boolean;
}

const reverifyAndProcessPayload = async ({
  context,
  node,
  knownHashes,
  privateKey,
  payload,
  timerContext,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly knownHashes: Set<UInt256Hex>;
  readonly privateKey: PrivateKey;
  readonly payload: ConsensusPayload;
  readonly timerContext: TimerContext;
}): Promise<ReverifyPayloadResult> => {
  const { blockchain } = node;
  try {
    await blockchain.verifyConsensusPayload(payload);
  } catch {
    return { context, verified: false };
  }

  const result = await handleConsensusPayload({
    context,
    node,
    knownHashes,
    privateKey,
    payload,
    timerContext,
    isRecovering: true,
  });

  return { context: result.context, verified: true };
};

const reverifyAndProcessPayloads = async ({
  context: contextIn,
  node,
  knownHashes,
  privateKey,
  payloads,
  timerContext,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly knownHashes: Set<UInt256Hex>;
  readonly privateKey: PrivateKey;
  readonly payloads: readonly ConsensusPayload[];
  readonly timerContext: TimerContext;
}): Promise<{ readonly context: ConsensusContext; readonly valid: number }> => {
  let valid = 0;
  let context = contextIn;
  // tslint:disable-next-line: no-loop-statement
  for (const p of payloads) {
    const { context: nextContext, verified } = await reverifyAndProcessPayload({
      context,
      node,
      knownHashes,
      privateKey,
      payload: p,
      timerContext,
    });

    if (verified) {
      valid += 1;
    }

    context = nextContext;
  }

  return { context, valid };
};

export const handleConsensusPayload = async ({
  context,
  node,
  knownHashes,
  privateKey,
  payload,
  timerContext,
  isRecovering = false,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly knownHashes: Set<UInt256Hex>;
  readonly privateKey: PrivateKey;
  readonly payload: ConsensusPayload;
  readonly timerContext: TimerContext;
  readonly isRecovering?: boolean;
}): Promise<Result> => {
  const { consensusMessage } = payload;
  if (
    payload.validatorIndex === context.myIndex ||
    payload.version !== context.blockBuilder.version ||
    !common.uInt256Equal(payload.previousHash, context.blockBuilder.previousHash ?? common.ZERO_UINT256) ||
    payload.blockIndex !== (context.blockBuilder.index ?? -1) ||
    payload.validatorIndex >= context.validators.length ||
    (consensusMessage.type !== ConsensusMessageType.ChangeView && consensusMessage.viewNumber !== context.viewNumber)
  ) {
    return { context };
  }

  switch (consensusMessage.type) {
    case ConsensusMessageType.ChangeView:
      return handleChangeView({
        context,
        node,
        payload,
        privateKey,
        timerContext,
        knownHashes,
        message: consensusMessage as ChangeViewConsensusMessage,
        isRecovering,
      });

    case ConsensusMessageType.PrepareRequest:
      return handlePrepareRequest({
        context,
        node,
        privateKey,
        payload,
        timerContext,
        message: consensusMessage as PrepareRequestConsensusMessage,
        isRecovering,
      });

    case ConsensusMessageType.PrepareResponse:
      return handlePrepareResponse({
        context,
        node,
        privateKey,
        payload,
        message: consensusMessage as PrepareResponseConsensusMessage,
      });

    case ConsensusMessageType.Commit:
      return handleCommit({
        context,
        node,
        payload,
        commit: consensusMessage as CommitConsensusMessage,
      });

    case ConsensusMessageType.RecoveryRequest:
      return handleRecoveryRequest({
        node,
        privateKey,
        context,
        payload,
        knownHashes,
      });

    case ConsensusMessageType.RecoveryMessage:
      return handleRecoveryMessage({
        node,
        context,
        knownHashes,
        privateKey,
        payload,
        message: consensusMessage as RecoveryConsensusMessage,
        timerContext,
      });

    default:
      commonUtils.assertNever(consensusMessage.type);
      throw new Error('For TS');
  }
};
