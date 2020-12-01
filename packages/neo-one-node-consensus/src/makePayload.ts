import { common, crypto, PrivateKey, UInt256, utils as commonUtils } from '@neo-one/client-common';
import {
  ChangeViewConsensusMessage,
  ChangeViewPayloadCompact,
  ChangeViewReason,
  CommitConsensusMessage,
  CommitPayloadCompact,
  ConsensusContext,
  ConsensusMessage,
  ConsensusPayload,
  Node,
  PreparationPayloadCompact,
  PrepareRequestConsensusMessage,
  PrepareResponseConsensusMessage,
  RecoveryConsensusMessage,
  RecoveryRequestConsensusMessage,
  UnsignedConsensusPayload,
} from '@neo-one/node-core';
import { utils } from '@neo-one/utils';
import { BN } from 'bn.js';
import _ from 'lodash';
import { ensureHeader, ensureMaxBlockLimitation } from './context';

const getPreparationHash = (preparationPayloads: readonly ConsensusPayload[]): UInt256 => {
  // tslint:disable-next-line: no-array-mutation
  const result = Object.entries(
    _.groupBy(preparationPayloads, (p) =>
      common.uInt256ToHex(p.getDeserializedMessage<PrepareResponseConsensusMessage>().preparationHash),
    ),
  ).sort(([, { length: aLength }], [, { length: bLength }]) => utils.numCompDescending(aLength, bLength))[0];

  // tslint:disable-next-line: strict-type-predicates
  if (result === undefined) {
    return common.ZERO_UINT256;
  }

  return common.hexToUInt256(result[0]);
};

export const makeSignedPayload = async ({
  node,
  privateKey,
  context,
  consensusMessage,
}: {
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly context: ConsensusContext;
  readonly consensusMessage: ConsensusMessage;
}) => {
  const validators = await node.blockchain.getNextBlockValidators();

  return ConsensusPayload.sign(
    new UnsignedConsensusPayload({
      version: context.blockBuilder.version ?? 0,
      previousHash: utils.nullthrows(context.blockBuilder.previousHash),
      blockIndex: utils.nullthrows(context.blockBuilder.index),
      validatorIndex: context.myIndex,
      consensusMessage,
      messageMagic: node.blockchain.deserializeWireContext.messageMagic,
    }),
    privateKey,
    validators,
    node.blockchain.deserializeWireContext.messageMagic,
  );
};

export const makeCommit = async ({
  context: contextIn,
  node,
  privateKey,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
}) => {
  let context = contextIn;
  const maybePayload = context.commitPayloads[context.myIndex];
  if (maybePayload) {
    return { context, payload: maybePayload };
  }

  const { context: newContext, block } = ensureHeader(context);
  context = newContext;
  if (block === undefined) {
    throw new Error();
  }

  const signature = crypto.sign({ message: context.blockBuilder.getBlock().message, privateKey });
  const signedPayload = await makeSignedPayload({
    node,
    privateKey,
    context,
    consensusMessage: new CommitConsensusMessage({ viewNumber: context.viewNumber, signature }),
  });

  const mutablePayloads = [...context.commitPayloads];
  mutablePayloads[context.myIndex] = signedPayload;

  context = context.clone({ commitPayloads: mutablePayloads });

  return { context, payload: signedPayload };
};

export const makePrepareResponse = async ({
  context: contextIn,
  node,
  privateKey,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
}) => {
  let context = contextIn;
  const payload = context.preparationPayloads[utils.nullthrows(context.blockBuilder?.consensusData?.primaryIndex)];
  if (payload === undefined) {
    // TODO
    throw new Error();
  }
  const preparationHash = payload.hash;

  const signedPayload = await makeSignedPayload({
    node,
    privateKey,
    context,
    consensusMessage: new PrepareResponseConsensusMessage({
      viewNumber: context.viewNumber,
      preparationHash,
    }),
  });

  const mutablePreparationPayloads = [...context.preparationPayloads];
  mutablePreparationPayloads[context.myIndex] = signedPayload;
  context = context.clone({ preparationPayloads: mutablePreparationPayloads });

  return { context, payload: signedPayload };
};

export const makeRecovery = async ({
  context: contextIn,
  node,
  privateKey,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
}) => {
  const context = contextIn;

  const prepareRequestMessage =
    context.transactionHashes !== undefined
      ? new PrepareRequestConsensusMessage({
          viewNumber: context.viewNumber,
          timestamp: utils.nullthrows(context.blockBuilder.timestamp),
          nonce: utils.nullthrows(context.blockBuilder.consensusData?.nonce),
          transactionHashes: context.transactionHashes,
        })
      : undefined;

  const changeViewMessages = _.fromPairs(
    _.take(
      context.lastChangeViewPayloads
        .filter(utils.notNull)
        .map((p) => [p.validatorIndex, ChangeViewPayloadCompact.fromPayload(p)]),
      context.M,
    ),
  );

  const filteredPreparationPayloads = context.preparationPayloads.filter(utils.notNull);

  const preparationHash =
    context.transactionHashes === undefined ? getPreparationHash(filteredPreparationPayloads) : undefined;

  const preparationMessages = _.fromPairs(
    filteredPreparationPayloads.map((p) => [p.validatorIndex, PreparationPayloadCompact.fromPayload(p)]),
  );

  const commitMessages = context.commitSent
    ? _.fromPairs(
        context.commitPayloads
          .filter(utils.notNull)
          .map((p) => [p.validatorIndex, CommitPayloadCompact.fromPayload(p)]),
      )
    : {};

  return makeSignedPayload({
    node,
    privateKey,
    context,
    consensusMessage: new RecoveryConsensusMessage({
      viewNumber: context.viewNumber,
      changeViewMessages,
      prepareRequestMessage,
      preparationHash,
      preparationMessages,
      commitMessages,
    }),
  });
};

export const makePrepareRequest = async ({
  node,
  privateKey,
  context: contextIn,
}: {
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly context: ConsensusContext;
}) => {
  let context = contextIn;
  const nonce = commonUtils.randomUInt();

  const { context: maxBlockContext } = await ensureMaxBlockLimitation(node, context, Object.values(node.memPool));
  context = maxBlockContext;

  const previousHeader = await node.blockchain.getHeader(utils.nullthrows(context.blockBuilder.previousHash));

  if (previousHeader === undefined) {
    // TODO
    throw new Error('expected this to be defined');
  }

  const timestamp = BN.max(new BN(Date.now()), previousHeader.timestamp.addn(1));
  context = context.clone({ blockOptions: { timestamp } });

  const preparationPayload = await makeSignedPayload({
    node,
    privateKey,
    context,
    consensusMessage: new PrepareRequestConsensusMessage({
      viewNumber: context.viewNumber,
      timestamp,
      nonce: new BN(nonce),
      transactionHashes: context.transactionHashes ?? [],
    }),
  });

  const mutablePreparationPayloads = [...context.preparationPayloads];
  mutablePreparationPayloads[context.myIndex] = preparationPayload;

  context = context.clone({ preparationPayloads: mutablePreparationPayloads });

  return { context, payload: preparationPayload };
};

export const makeRecoveryRequest = async ({
  node,
  context,
  privateKey,
}: {
  readonly node: Node;
  readonly context: ConsensusContext;
  readonly privateKey: PrivateKey;
}): Promise<ConsensusPayload> => {
  const consensusMessage = new RecoveryRequestConsensusMessage({
    viewNumber: context.viewNumber,
    timestamp: new BN(Date.now()),
  });

  return makeSignedPayload({
    node,
    context,
    privateKey,
    consensusMessage,
  });
};

export const makeChangeView = async ({
  node,
  privateKey,
  context: contextIn,
  reason,
}: {
  readonly node: Node;
  readonly context: ConsensusContext;
  readonly privateKey: PrivateKey;
  readonly reason: ChangeViewReason;
}) => {
  const context = contextIn;
  const payload = await makeSignedPayload({
    node,
    privateKey,
    context,
    consensusMessage: new ChangeViewConsensusMessage({
      viewNumber: context.viewNumber,
      reason,
      timestamp: new BN(Date.now()),
    }),
  });

  const mutableChangeViewPayloads = [...context.changeViewPayloads];
  mutableChangeViewPayloads[context.myIndex] = payload;

  return { context: context.clone({ changeViewPayloads: mutableChangeViewPayloads }), payload };
};
