import { common, crypto, PrivateKey, UInt256, utils as commonUtils } from '@neo-one/client-common';
import {
  ChangeViewConsensusMessage,
  ChangeViewPayloadCompact,
  ChangeViewReason,
  CommitConsensusMessage,
  CommitPayloadCompact,
  ConsensusContext,
  ConsensusMessage,
  ExtensiblePayload,
  Node,
  PreparationPayloadCompact,
  PrepareRequestConsensusMessage,
  PrepareResponseConsensusMessage,
  RecoveryConsensusMessage,
  RecoveryRequestConsensusMessage,
  UnsignedExtensiblePayload,
} from '@neo-one/node-core';
import { utils } from '@neo-one/utils';
import { BN } from 'bn.js';
import _ from 'lodash';
import { ensureHeader, ensureMaxBlockLimitation } from './context';

const getPreparationHash = (context: ConsensusContext, preparationPayloads: readonly ExtensiblePayload[]): UInt256 => {
  // tslint:disable-next-line: no-array-mutation
  const result = Object.entries(
    _.groupBy(preparationPayloads, (p) =>
      common.uInt256ToHex(context.getMessage<PrepareResponseConsensusMessage>(p).preparationHash),
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
  consensusMessage,
}: {
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly context: ConsensusContext;
  readonly consensusMessage: ConsensusMessage;
}) =>
  ExtensiblePayload.sign(
    new UnsignedExtensiblePayload({
      category: 'dBFT',
      validBlockStart: 0,
      validBlockEnd: consensusMessage.validatorIndex,
      data: consensusMessage.serializeWire(),
      sender: crypto.privateKeyToScriptHash(privateKey), // TODO: not sure this is correct
      messageMagic: node.blockchain.deserializeWireContext.messageMagic,
    }),
    privateKey,
    node.blockchain.deserializeWireContext.messageMagic,
  );

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
    consensusMessage: new CommitConsensusMessage({
      validatorIndex: context.myIndex,
      blockIndex: utils.nullthrows(block.index),
      viewNumber: context.viewNumber,
      signature,
    }),
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
    throw new Error('makePrepareResponse expected payload to be defined');
  }
  const preparationHash = payload.hash;

  const signedPayload = await makeSignedPayload({
    node,
    privateKey,
    context,
    consensusMessage: new PrepareResponseConsensusMessage({
      validatorIndex: context.myIndex,
      blockIndex: utils.nullthrows(context.blockBuilder.index),
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
          version: utils.nullthrows(context.blockBuilder.version),
          prevHash: utils.nullthrows(context.blockBuilder.previousHash),
          validatorIndex: context.myIndex, // TODO: not sure this is correct
          blockIndex: utils.nullthrows(context.blockBuilder.index),
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
        .map((p) => getChangeViewPayloadCompact(context, p))
        .map((p) => [p.validatorIndex, p]),
      context.M,
    ),
  );

  const filteredPreparationPayloads = context.preparationPayloads.filter(utils.notNull);

  const preparationHash =
    context.transactionHashes === undefined ? getPreparationHash(context, filteredPreparationPayloads) : undefined;

  const preparationMessages = _.fromPairs(
    filteredPreparationPayloads.map((p) => getPreparationPayloadCompact(context, p)).map((p) => [p.validatorIndex, p]),
  );

  const commitMessages = context.commitSent
    ? _.fromPairs(
        context.commitPayloads
          .filter(utils.notNull)
          .map((p) => getCommitPayloadCompact(context, p))
          .map((p) => [p.validatorIndex, p]),
      )
    : {};

  return makeSignedPayload({
    node,
    privateKey,
    context,
    consensusMessage: new RecoveryConsensusMessage({
      validatorIndex: context.myIndex,
      blockIndex: utils.nullthrows(context.blockBuilder.index),
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
    throw new Error('makePrepareRequested expected previousHeader to be defined');
  }

  const timestamp = BN.max(new BN(Date.now()), previousHeader.timestamp.addn(1));
  context = context.clone({ blockOptions: { timestamp, consensusData: { nonce: new BN(nonce) } } });

  const preparationPayload = await makeSignedPayload({
    node,
    privateKey,
    context,
    consensusMessage: new PrepareRequestConsensusMessage({
      version: utils.nullthrows(context.blockBuilder.version),
      prevHash: utils.nullthrows(context.blockBuilder.previousHash),
      validatorIndex: context.myIndex,
      blockIndex: utils.nullthrows(context.blockBuilder.index),
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
}): Promise<ExtensiblePayload> => {
  const consensusMessage = new RecoveryRequestConsensusMessage({
    validatorIndex: context.myIndex,
    blockIndex: utils.nullthrows(context.blockBuilder.index),
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
      validatorIndex: context.myIndex,
      blockIndex: utils.nullthrows(context.blockBuilder.index),
      viewNumber: context.viewNumber,
      reason,
      timestamp: new BN(Date.now()),
    }),
  });

  const mutableChangeViewPayloads = [...context.changeViewPayloads];
  mutableChangeViewPayloads[context.myIndex] = payload;

  return { context: context.clone({ changeViewPayloads: mutableChangeViewPayloads }), payload };
};

export const getChangeViewPayloadCompact = (context: ConsensusContext, payload: ExtensiblePayload) => {
  const message = context.getMessage<ChangeViewConsensusMessage>(payload);

  return new ChangeViewPayloadCompact({
    validatorIndex: message.validatorIndex,
    originalViewNumber: message.viewNumber,
    timestamp: message.timestamp,
    invocationScript: payload.witness.invocation,
  });
};

export const getCommitPayloadCompact = (context: ConsensusContext, payload: ExtensiblePayload) => {
  const message = context.getMessage<CommitConsensusMessage>(payload);

  return new CommitPayloadCompact({
    viewNumber: message.viewNumber,
    validatorIndex: message.validatorIndex,
    signature: message.signature,
    invocationScript: payload.witness.invocation,
  });
};

export const getPreparationPayloadCompact = (context: ConsensusContext, payload: ExtensiblePayload) =>
  new PreparationPayloadCompact({
    validatorIndex: context.getMessage(payload).validatorIndex,
    invocationScript: payload.witness.invocation,
  });
