/* @flow */
import {
  CONSENSUS_MESSAGE_TYPE,
  type ChangeViewConsensusMessage,
  type ConsensusPayload,
  type PrepareRequestConsensusMessage,
  type PrepareResponseConsensusMessage,
  type PrivateKey,
  common,
  crypto,
} from '@neo-one/client-core';

import { type Context, HeaderContext, RequestReceivedContext } from './context';
import type Node from '../Node';
import type { Result } from './types';
import type ConsensusContext from './ConsensusContext';

import {
  addTransaction,
  checkExpectedView,
  checkSignatures,
  initializeConsensus,
} from './common';

const handleChangeView = ({
  context: contextIn,
  node,
  payload,
  consensusContext,
  message,
}: {|
  context: Context,
  node: Node,
  payload: ConsensusPayload,
  consensusContext: ConsensusContext,
  message: ChangeViewConsensusMessage,
|}): Result<Context> => {
  let context = contextIn;
  const viewNumber = message.newViewNumber;
  if (viewNumber > context.expectedView[payload.validatorIndex]) {
    const expectedView = [...context.expectedView];
    expectedView[payload.validatorIndex] = viewNumber;
    context = context.cloneExpectedView({ expectedView });
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
}: {|
  context: Context,
  node: Node,
  privateKey: PrivateKey,
  payload: ConsensusPayload,
  consensusContext: ConsensusContext,
  message: PrepareRequestConsensusMessage,
|}): Promise<Result<Context>> => {
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

  const signatures = [];
  signatures[payload.validatorIndex] = message.signature;
  const newContext = new RequestReceivedContext({
    viewNumber: context.viewNumber,
    myIndex: context.myIndex,
    primaryIndex: context.primaryIndex,
    expectedView: context.expectedView,
    validators: context.validators,
    blockReceivedTimeSeconds: context.blockReceivedTimeSeconds,
    transactions: {},
    signatures,
    header: {
      type: 'new',
      previousHash: context.previousHash,
      transactionHashes: message.transactionHashes.map(hash =>
        common.uInt256ToHex(hash),
      ),
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
  context = newContext;
  for (const hash of context.transactionHashes.slice(1)) {
    const transaction = node.memPool[hash];
    if (transaction != null) {
      // eslint-disable-next-line
      const result = await addTransaction({
        context,
        node,
        privateKey,
        transaction,
        verify: false,
        consensusContext,
      });
      if (!(result.context instanceof RequestReceivedContext)) {
        return result;
      }
      // eslint-disable-next-line
      context = result.context;
    }
  }

  const result = await addTransaction({
    context,
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
  context: contextIn,
  node,
  payload,
  message,
}: {|
  context: Context,
  node: Node,
  payload: ConsensusPayload,
  message: PrepareResponseConsensusMessage,
|}): Promise<Result<Context>> => {
  let context = contextIn;
  if (
    context instanceof HeaderContext &&
    context.signatures[payload.validatorIndex] == null &&
    crypto.verify({
      message: context.header.message,
      signature: message.signature,
      publicKey: context.validators[payload.validatorIndex],
    })
  ) {
    const signatures = [...context.signatures];
    signatures[payload.validatorIndex] = message.signature;
    context = context.cloneSignatures({ signatures });
    return checkSignatures({ context, node });
  }

  return { context };
};

export default async ({
  context,
  node,
  privateKey,
  payload,
  consensusContext,
}: {|
  context: Context,
  node: Node,
  privateKey: PrivateKey,
  payload: ConsensusPayload,
  consensusContext: ConsensusContext,
|}): Promise<Result<Context>> => {
  const { consensusMessage } = payload;
  if (
    payload.validatorIndex === context.myIndex ||
    payload.version !== context.version ||
    !common.uInt256Equal(payload.previousHash, context.previousHash) ||
    payload.blockIndex !== context.blockIndex ||
    payload.validatorIndex >= context.validators.length ||
    (consensusMessage.type !== CONSENSUS_MESSAGE_TYPE.CHANGE_VIEW &&
      consensusMessage.viewNumber !== context.viewNumber)
  ) {
    return { context };
  }

  switch (consensusMessage.type) {
    case 0x00:
      return handleChangeView({
        context,
        node,
        payload,
        consensusContext,
        message: ((consensusMessage: $FlowFixMe): ChangeViewConsensusMessage),
      });
    case 0x20:
      return handlePrepareRequest({
        context,
        node,
        privateKey,
        payload,
        consensusContext,
        message: ((consensusMessage: $FlowFixMe): PrepareRequestConsensusMessage),
      });
    case 0x21:
      return handlePrepareResponse({
        context,
        node,
        payload,
        message: ((consensusMessage: $FlowFixMe): PrepareResponseConsensusMessage),
      });
    default:
      // eslint-disable-next-line
      (consensusMessage.type: empty);
      throw new Error('For ESLint');
  }
};
