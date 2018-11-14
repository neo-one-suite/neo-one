import { common, crypto, PrivateKey } from '@neo-one/client-common';
import {
  ChangeViewConsensusMessage,
  ConsensusMessageType,
  ConsensusPayload,
  Node,
  PrepareRequestConsensusMessage,
  PrepareResponseConsensusMessage,
  Transaction,
} from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
import { addTransaction, checkExpectedView, checkSignatures, initializeConsensus } from './common';
import { ConsensusContext } from './ConsensusContext';
import { Context, HeaderContext, RequestReceivedContext } from './context';
import { Result } from './types';

const handleChangeView = ({
  context: contextIn,
  node,
  payload,
  consensusContext,
  message,
}: {
  readonly context: Context;
  readonly node: Node;
  readonly payload: ConsensusPayload;
  readonly consensusContext: ConsensusContext;
  readonly message: ChangeViewConsensusMessage;
}): Result<Context> => {
  let context = contextIn;
  const viewNumber = message.newViewNumber;
  if (viewNumber > context.expectedView[payload.validatorIndex]) {
    const mutableExpectedView = [...context.expectedView];
    mutableExpectedView[payload.validatorIndex] = viewNumber;
    context = context.cloneExpectedView({ expectedView: mutableExpectedView });
    if (checkExpectedView({ context, viewNumber })) {
      return initializeConsensus({
        node,
        context,
        viewNumber,
        consensusContext,
      });
    }
  }

  return { context };
};

const TEN_MINUTES_IN_SECONDS = 10 * 60;

const handlePrepareRequest = async ({
  context: contextIn,
  node,
  privateKey,
  payload,
  consensusContext,
  message,
}: {
  readonly context: Context;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly payload: ConsensusPayload;
  readonly consensusContext: ConsensusContext;
  readonly message: PrepareRequestConsensusMessage;
}): Promise<Result<Context>> => {
  let context = contextIn;
  if (
    context.type !== 'backup' ||
    context instanceof RequestReceivedContext ||
    payload.validatorIndex !== context.primaryIndex ||
    payload.timestamp > consensusContext.nowSeconds() + TEN_MINUTES_IN_SECONDS
  ) {
    return { context };
  }
  const header = await node.blockchain.header.get({
    hashOrIndex: context.previousHash,
  });

  if (payload.timestamp <= header.timestamp) {
    return { context };
  }

  const mutableSignatures = [];
  mutableSignatures[payload.validatorIndex] = message.signature;
  const newContext = new RequestReceivedContext({
    viewNumber: context.viewNumber,
    myIndex: context.myIndex,
    primaryIndex: context.primaryIndex,
    expectedView: context.expectedView,
    validators: context.validators,
    blockReceivedTimeSeconds: context.blockReceivedTimeSeconds,
    transactions: {},
    signatures: mutableSignatures,
    header: {
      type: 'new',
      previousHash: context.previousHash,
      transactionHashes: message.transactionHashes.map((hash) => common.uInt256ToHex(hash)),

      blockIndex: context.blockIndex,
      nonce: message.nonce,
      timestamp: payload.timestamp,
      nextConsensus: message.nextConsensus,
    },
  });

  const verified = crypto.verify({
    message: newContext.header.message,
    signature: message.signature,
    publicKey: context.validators[payload.validatorIndex],
  });

  if (!verified) {
    return { context };
  }

  let nextContext = newContext;
  // tslint:disable-next-line no-loop-statement
  for (const hash of newContext.transactionHashes.slice(1)) {
    const transaction = node.memPool[hash] as Transaction | undefined;
    if (transaction !== undefined) {
      const res = await addTransaction({
        context: nextContext,
        node,
        privateKey,
        transaction,
        verify: false,
        consensusContext,
      });

      if (!(res.context instanceof RequestReceivedContext)) {
        return res;
      }
      // eslint-disable-next-line
      nextContext = res.context;
    }
  }

  const result = await addTransaction({
    context: nextContext,
    node,
    privateKey,
    transaction: message.minerTransaction,
    verify: true,
    consensusContext,
  });

  if (!(result.context instanceof RequestReceivedContext)) {
    return result;
  }
  // eslint-disable-next-line
  context = result.context;
  node.syncMemPool();

  return { context };
};

const handlePrepareResponse = async ({
  context,
  node,
  payload,
  message,
}: {
  readonly context: Context;
  readonly node: Node;
  readonly payload: ConsensusPayload;
  readonly message: PrepareResponseConsensusMessage;
}): Promise<Result<Context>> => {
  if (
    context instanceof HeaderContext &&
    context.signatures[payload.validatorIndex] === undefined &&
    crypto.verify({
      message: context.header.message,
      signature: message.signature,
      publicKey: context.validators[payload.validatorIndex],
    })
  ) {
    const mutableSignatures = [...context.signatures];
    mutableSignatures[payload.validatorIndex] = message.signature;
    const newContext = context.cloneSignatures({ signatures: mutableSignatures });

    return checkSignatures({ context: newContext, node });
  }

  return { context };
};

export const handleConsensusPayload = async ({
  context,
  node,
  privateKey,
  payload,
  consensusContext,
}: {
  readonly context: Context;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly payload: ConsensusPayload;
  readonly consensusContext: ConsensusContext;
}): Promise<Result<Context>> => {
  const { consensusMessage } = payload;
  if (
    payload.validatorIndex === context.myIndex ||
    payload.version !== context.version ||
    !common.uInt256Equal(payload.previousHash, context.previousHash) ||
    payload.blockIndex !== context.blockIndex ||
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
        consensusContext,
        message: consensusMessage,
      });

    case ConsensusMessageType.PrepareRequest:
      return handlePrepareRequest({
        context,
        node,
        privateKey,
        payload,
        consensusContext,
        message: consensusMessage,
      });

    case ConsensusMessageType.PrepareResponse:
      return handlePrepareResponse({
        context,
        node,
        payload,
        message: consensusMessage,
      });

    default:
      commonUtils.assertNever(consensusMessage);
      throw new Error('For TS');
  }
};
