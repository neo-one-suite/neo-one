/* @flow */
import {
  type ECPoint,
  type ConsensusMessage,
  type PrivateKey,
  type Transaction,
  ChangeViewConsensusMessage,
  ConsensusPayload,
  PrepareResponseConsensusMessage,
  UnsignedConsensusPayload,
  common,
  crypto,
} from '@neo-one/client-core';
import { type Blockchain } from '@neo-one/node-core';

import _ from 'lodash';
import { utils as commonUtils } from '@neo-one/utils';

import {
  type HeaderContext,
  BlockSentContext,
  Context,
  InitialContext,
  SignatureSentContext,
  RequestReceivedContext,
  ViewChangingContext,
} from './context';
import type { Result } from './types';
import type Node from '../Node';

export const signAndRelay = ({
  node,
  privateKey,
  context,
  consensusMessage,
}: {|
  node: Node,
  privateKey: PrivateKey,
  context: Context,
  consensusMessage: ConsensusMessage,
|}) => {
  const payload = ConsensusPayload.sign(
    new UnsignedConsensusPayload({
      version: context.version,
      previousHash: context.previousHash,
      blockIndex: context.blockIndex,
      validatorIndex: context.myIndex,
      consensusMessage,
    }),
    privateKey,
  );
  node.blockchain.log({
    event: 'CONSENSUS_SIGN_AND_RELAY',
    message: payload.consensusMessage.constructor.name,
  });
  node.relayConsensusPayload(payload);
};

export const getInitialContextAdd = ({
  blockchain,
  publicKey,
  validators,
  blockReceivedTimeSeconds,
}: {|
  blockchain: Blockchain,
  publicKey: ECPoint,
  validators: Array<ECPoint>,
  blockReceivedTimeSeconds?: number,
|}) => {
  const blockIndex = blockchain.currentBlock.index + 1;
  const primaryIndex = blockIndex % validators.length;
  const myIndex = _.findIndex(validators, validator =>
    common.ecPointEqual(validator, publicKey),
  );

  return {
    type: primaryIndex === myIndex ? 'primary' : 'backup',
    previousHash: blockchain.currentBlock.hash,
    blockIndex,
    viewNumber: 0,
    myIndex,
    primaryIndex,
    expectedView: _.range(0, validators.length).map(() => 0),
    validators,
    blockReceivedTimeSeconds,
  };
};

function initializeConsensusCommon<
  TContext: InitialContext | SignatureSentContext,
>({
  context,
  blockchain,
}: {|
  context: TContext,
  blockchain: Blockchain,
|}): Result<TContext> {
  if (context.myIndex < 0) {
    return { context };
  }

  if (context.type === 'primary') {
    return {
      context,
      timerSeconds: Math.max(
        0,
        blockchain.settings.secondsPerBlock -
          (commonUtils.nowSeconds() - context.blockReceivedTimeSeconds),
      ),
    };
  }

  const { secondsPerBlock } = blockchain.settings;
  return {
    context,
    // eslint-disable-next-line
    timerSeconds: secondsPerBlock << (context.viewNumber + 1),
  };
}

export const initializeNewConsensus = async ({
  blockchain,
  publicKey,
}: {|
  blockchain: Blockchain,
  publicKey: ECPoint,
|}): Promise<Result<InitialContext>> => {
  const validators = await blockchain.getValidators([]);
  const blockReceivedTimeSeconds = blockchain.currentBlock.timestamp;
  const blockIndex = blockchain.currentBlock.index + 1;
  const primaryIndex = blockIndex % validators.length;
  const myIndex = _.findIndex(validators, validator =>
    common.ecPointEqual(validator, publicKey),
  );

  const context = new InitialContext({
    type: primaryIndex === myIndex ? 'primary' : 'backup',
    previousHash: blockchain.currentBlock.hash,
    blockIndex,
    viewNumber: 0,
    myIndex,
    primaryIndex,
    expectedView: _.range(0, validators.length).map(() => 0),
    validators,
    blockReceivedTimeSeconds,
  });
  blockchain.log({
    event: 'INITIALIZE_NEW_CONSENSUS',
    context: { ...context.toJSON() },
  });

  return initializeConsensusCommon({ context, blockchain });
};

const getPrimaryIndexType = ({
  context,
  viewNumber,
}: {|
  context: Context,
  viewNumber: number,
|}) => {
  let primaryIndex =
    (context.blockIndex - viewNumber) % context.validators.length;
  if (primaryIndex < 0) {
    primaryIndex += context.validators.length;
  }

  return {
    type: primaryIndex === context.myIndex ? 'primary' : 'backup',
    primaryIndex,
  };
};

export const initializeConsensus = ({
  node,
  context: contextIn,
  viewNumber,
}: {|
  node: Node,
  context: Context,
  viewNumber: number,
|}): Result<InitialContext | SignatureSentContext> => {
  if (viewNumber <= 0) {
    throw new Error('Programming error');
  }
  const { blockchain } = node;
  let context = contextIn;
  let primaryIndex =
    (context.blockIndex - viewNumber) % context.validators.length;
  if (primaryIndex < 0) {
    primaryIndex += context.validators.length;
  }
  const type = primaryIndex === context.myIndex ? 'primary' : 'backup';
  if (type === 'primary' && context instanceof SignatureSentContext) {
    context = context.clone({ type, primaryIndex, viewNumber });
  } else {
    context = context.cloneInitial({ type, primaryIndex, viewNumber });
  }

  return initializeConsensusCommon({ blockchain, context });
};

export async function checkSignatures<TContext: HeaderContext>({
  node,
  context,
}: {|
  node: Node,
  context: TContext,
|}): Promise<Result<TContext | BlockSentContext>> {
  const signaturesLength = context.signatures.filter(p => p != null).length;

  if (
    signaturesLength >= context.M &&
    context.transactionHashes.every(hash => context.transactions[hash] != null)
  ) {
    const publicKeyToSignature = {};
    for (
      let i = 0, j = 0;
      i < context.validators.length && j < context.M;
      i += 1
    ) {
      const validator = context.validators[i];
      const signature = context.signatures[i];
      if (signature != null) {
        publicKeyToSignature[
          (common.ecPointToHex(validator): $FlowFixMe)
        ] = signature;
        j += 1;
      }
    }
    const script = crypto.createMultiSignatureWitness(
      context.M,
      context.validators,
      publicKeyToSignature,
    );
    const block = context.header.clone({
      transactions: context.transactionHashes.map(
        hash => context.transactions[hash],
      ),
      script,
    });
    await node.relayBlock(block);
    return { context: context.cloneBlockSent() };
  }

  return { context };
}

export const signAndRelayChangeView = ({
  node,
  privateKey,
  context,
}: {|
  node: Node,
  privateKey: PrivateKey,
  context: Context,
|}) => {
  signAndRelay({
    node,
    privateKey,
    context,
    consensusMessage: new ChangeViewConsensusMessage({
      viewNumber: context.viewNumber,
      newViewNumber: context.expectedView[context.myIndex],
    }),
  });
};

export const checkExpectedView = ({
  context,
  viewNumber,
}: {|
  context: Context,
  viewNumber: number,
|}) =>
  context.viewNumber !== viewNumber &&
  context.expectedView.filter(p => p === viewNumber).length >= context.M;

export const initializeConsensusInitial = ({
  blockchain,
  context,
  viewNumber,
}: {|
  blockchain: Blockchain,
  context: Context,
  viewNumber: number,
|}): Result<InitialContext> => {
  const { primaryIndex, type } = getPrimaryIndexType({ context, viewNumber });
  return initializeConsensusCommon({
    blockchain,
    context: context.cloneInitial({ type, primaryIndex, viewNumber }),
  });
};

export const incrementExpectedView = (context: Context): Array<number> => {
  const expectedView = [...context.expectedView];
  expectedView[context.myIndex] += 1;
  return expectedView;
};

const requestChangeViewBackup = ({
  context: contextIn,
  node,
  privateKey,
}: {|
  context: RequestReceivedContext,
  node: Node,
  privateKey: PrivateKey,
|}): Result<InitialContext | ViewChangingContext> => {
  let context = contextIn;

  context = context.cloneViewChanging({
    expectedView: incrementExpectedView(context),
  });

  signAndRelayChangeView({ context, node, privateKey });

  const viewNumber = context.expectedView[context.myIndex];
  if (checkExpectedView({ context, viewNumber })) {
    return initializeConsensusInitial({
      blockchain: node.blockchain,
      context,
      viewNumber,
    });
  }

  return { context };
};

export const addTransaction = async ({
  context: contextIn,
  node,
  privateKey,
  transaction,
  verify,
}: {|
  context: RequestReceivedContext,
  node: Node,
  privateKey: PrivateKey,
  transaction: Transaction,
  verify: boolean,
|}): Promise<
  Result<
    | RequestReceivedContext
    | InitialContext
    | ViewChangingContext
    | SignatureSentContext
    | BlockSentContext,
  >,
> => {
  let context = contextIn;
  const { blockchain } = node;
  const tx = await blockchain.transaction.tryGet({ hash: transaction.hash });
  if (tx != null) {
    return requestChangeViewBackup({ context, node, privateKey });
  }
  if (verify) {
    let verified = true;
    try {
      await blockchain.verifyTransaction({
        transaction,
        memPool: commonUtils.values(context.transactions),
      });
    } catch (error) {
      node.blockchain.log({
        event: 'CONSENSUS_INVALID_TRANSACTION',
        hash: transaction.hashHex,
        error,
      });
      verified = false;
    }
    if (!verified) {
      return requestChangeViewBackup({ context, node, privateKey });
    }
  }

  context = context.clone({
    transactions: {
      ...context.transactions,
      [(transaction.hashHex: $FlowFixMe)]: transaction,
    },
  });

  const transactionsLength = Object.values(context.transactions).length;
  if (context.transactionHashes.length === transactionsLength) {
    const validators = await blockchain.getValidators(
      commonUtils.values(context.transactions),
    );
    const consensusAddress = crypto.getConsensusAddress(validators);
    if (common.uInt160Equal(consensusAddress, context.header.nextConsensus)) {
      const signatures = [...context.signatures];
      signatures[context.myIndex] = crypto.sign({
        message: context.header.message,
        privateKey,
      });
      context = context.cloneSignatureSent({ signatures });
      signAndRelay({
        node,
        context,
        privateKey,
        consensusMessage: new PrepareResponseConsensusMessage({
          viewNumber: context.viewNumber,
          signature: commonUtils.nullthrows(signatures[context.myIndex]),
        }),
      });
      return checkSignatures({ node, context });
    }

    node.blockchain.log({
      event: 'CONSENSUS_WRONG_CONSENSUS_ADDRESS',
      consensusAddress: common.uInt160ToString(context.header.nextConsensus),
      expectedConsensusAddress: common.uInt160ToString(consensusAddress),
    });

    return requestChangeViewBackup({ context, node, privateKey });
  }

  return { context };
};
