import {
  ChangeViewConsensusMessage,
  common,
  ConsensusMessage,
  ConsensusPayload,
  crypto,
  ECPoint,
  PrepareResponseConsensusMessage,
  PrivateKey,
  Transaction,
  UnsignedConsensusPayload,
} from '@neo-one/client-core';
import { Blockchain } from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
import * as _ from 'lodash';
import { Node } from '../Node';
import { ConsensusContext } from './ConsensusContext';
import {
  BlockSentContext,
  Context,
  HeaderContext,
  InitialContext,
  RequestReceivedContext,
  SignatureSentContext,
  Type,
  ViewChangingContext,
} from './context';
import { Result } from './types';

export const signAndRelay = ({
  node,
  privateKey,
  context,
  consensusMessage,
}: {
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly context: Context;
  readonly consensusMessage: ConsensusMessage;
}) => {
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

  node.relayConsensusPayload(payload);
};

export const getInitialContextAdd = ({
  blockchain,
  publicKey,
  validators,
  blockReceivedTimeSeconds,
}: {
  readonly blockchain: Blockchain;
  readonly publicKey: ECPoint;
  readonly validators: ReadonlyArray<ECPoint>;
  readonly blockReceivedTimeSeconds?: number;
}) => {
  const blockIndex = blockchain.currentBlock.index + 1;
  const primaryIndex = blockIndex % validators.length;
  const myIndex = _.findIndex(validators, (validator) => common.ecPointEqual(validator, publicKey));

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

function initializeConsensusCommon<TContext extends InitialContext | SignatureSentContext>({
  context,
  blockchain,
  consensusContext,
}: {
  readonly context: TContext;
  readonly blockchain: Blockchain;
  readonly consensusContext: ConsensusContext;
}): Result<TContext> {
  if (context.myIndex < 0) {
    return { context };
  }

  if (context.type === 'primary') {
    return {
      context,
      timerSeconds: Math.max(
        0,
        blockchain.settings.secondsPerBlock - (consensusContext.nowSeconds() - context.blockReceivedTimeSeconds),
      ),
    };
  }

  const { secondsPerBlock } = blockchain.settings;

  return {
    context,
    // tslint:disable-next-line no-bitwise
    timerSeconds: secondsPerBlock << (context.viewNumber + 1),
  };
}

export const initializeNewConsensus = async ({
  blockchain,
  publicKey,
  consensusContext,
}: {
  readonly blockchain: Blockchain;
  readonly publicKey: ECPoint;
  readonly consensusContext: ConsensusContext;
}): Promise<Result<InitialContext>> => {
  const validators = await blockchain.getValidators([]);
  const blockReceivedTimeSeconds = blockchain.currentBlock.timestamp;
  const blockIndex = blockchain.currentBlock.index + 1;
  const primaryIndex = blockIndex % validators.length;
  const myIndex = _.findIndex(validators, (validator) => common.ecPointEqual(validator, publicKey));

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

  return initializeConsensusCommon({ context, blockchain, consensusContext });
};

const getPrimaryIndexType = ({
  context,
  viewNumber,
}: {
  readonly context: Context;
  readonly viewNumber: number;
}): {
  readonly type: Type;
  readonly primaryIndex: number;
} => {
  let primaryIndex = (context.blockIndex - viewNumber) % context.validators.length;
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
  consensusContext,
}: {
  readonly node: Node;
  readonly context: Context;
  readonly viewNumber: number;
  readonly consensusContext: ConsensusContext;
}): Result<InitialContext | SignatureSentContext> => {
  if (viewNumber <= 0) {
    throw new Error('Programming error');
  }
  const { blockchain } = node;
  let context = contextIn;
  let primaryIndex = (context.blockIndex - viewNumber) % context.validators.length;
  if (primaryIndex < 0) {
    primaryIndex += context.validators.length;
  }
  const type = primaryIndex === context.myIndex ? 'primary' : 'backup';
  context =
    type === 'primary' && context instanceof SignatureSentContext
      ? context.clone({ type, primaryIndex, viewNumber })
      : context.cloneInitial({ type, primaryIndex, viewNumber });

  return initializeConsensusCommon({ blockchain, context, consensusContext });
};

export async function checkSignatures<TContext extends HeaderContext>({
  node,
  context,
}: {
  readonly node: Node;
  readonly context: TContext;
}): Promise<Result<TContext | BlockSentContext>> {
  const signaturesLength = context.signatures.filter((p) => p !== undefined).length;

  if (
    signaturesLength >= context.M &&
    context.transactionHashes.every((hash) => context.transactions[hash] !== undefined)
  ) {
    const mutablePublicKeyToSignature: { [key: string]: Buffer } = {};
    // tslint:disable-next-line no-loop-statement
    for (let i = 0, j = 0; i < context.validators.length && j < context.M; i += 1) {
      const validator = context.validators[i];
      const signature = context.signatures[i];
      if (signature !== undefined) {
        mutablePublicKeyToSignature[common.ecPointToHex(validator)] = signature;
        j += 1;
      }
    }
    const script = crypto.createMultiSignatureWitness(context.M, context.validators, mutablePublicKeyToSignature);

    const block = context.header.clone({
      transactions: context.transactionHashes.map((hash) => context.transactions[hash]).filter(commonUtils.notNull),

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
}: {
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly context: Context;
}) => {
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
}: {
  readonly context: Context;
  readonly viewNumber: number;
}) => context.viewNumber !== viewNumber && context.expectedView.filter((p) => p === viewNumber).length >= context.M;

export const initializeConsensusInitial = ({
  blockchain,
  context,
  viewNumber,
  consensusContext,
}: {
  readonly blockchain: Blockchain;
  readonly context: Context;
  readonly viewNumber: number;
  readonly consensusContext: ConsensusContext;
}): Result<InitialContext> => {
  const { primaryIndex, type } = getPrimaryIndexType({ context, viewNumber });

  return initializeConsensusCommon({
    blockchain,
    context: context.cloneInitial({ type, primaryIndex, viewNumber }),
    consensusContext,
  });
};

export const incrementExpectedView = (context: Context): ReadonlyArray<number> => {
  const mutableExpectedView = [...context.expectedView];
  mutableExpectedView[context.myIndex] += 1;

  return mutableExpectedView;
};

const requestChangeViewBackup = ({
  context: contextIn,
  node,
  privateKey,
  consensusContext,
}: {
  readonly context: RequestReceivedContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly consensusContext: ConsensusContext;
}): Result<InitialContext | ViewChangingContext> => {
  const context = contextIn.cloneViewChanging({
    expectedView: incrementExpectedView(contextIn),
  });

  signAndRelayChangeView({ context, node, privateKey });

  const viewNumber = context.expectedView[context.myIndex];
  if (checkExpectedView({ context, viewNumber })) {
    return initializeConsensusInitial({
      blockchain: node.blockchain,
      context,
      viewNumber,
      consensusContext,
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
  consensusContext,
}: {
  readonly context: RequestReceivedContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly transaction: Transaction;
  readonly verify: boolean;
  readonly consensusContext: ConsensusContext;
}): Promise<
  Result<RequestReceivedContext | InitialContext | ViewChangingContext | SignatureSentContext | BlockSentContext>
> => {
  let context = contextIn;
  const { blockchain } = node;
  const tx = await blockchain.transaction.tryGet({ hash: transaction.hash });
  if (tx !== undefined) {
    return { context };
  }
  if (verify) {
    let verified = true;
    try {
      await blockchain.verifyTransaction({
        transaction,
        memPool: Object.values(context.transactions).filter(commonUtils.notNull),
      });
    } catch {
      verified = false;
    }
    if (!verified) {
      return { context };
    }
  }

  context = context.clone({
    transactions: {
      ...context.transactions,
      [transaction.hashHex]: transaction,
    },
  });

  const transactionsLength = Object.values(context.transactions).length;
  if (context.transactionHashes.length === transactionsLength) {
    const validators = await blockchain.getValidators(Object.values(context.transactions).filter(commonUtils.notNull));

    const consensusAddress = crypto.getConsensusAddress(validators);
    if (common.uInt160Equal(consensusAddress, context.header.nextConsensus)) {
      const mutableSignatures = [...context.signatures];
      mutableSignatures[context.myIndex] = crypto.sign({
        message: context.header.message,
        privateKey,
      });

      const newContext = context.cloneSignatureSent({ signatures: mutableSignatures });
      signAndRelay({
        node,
        context: newContext,
        privateKey,
        consensusMessage: new PrepareResponseConsensusMessage({
          viewNumber: newContext.viewNumber,
          signature: commonUtils.nullthrows(mutableSignatures[newContext.myIndex]),
        }),
      });

      return checkSignatures({ node, context: newContext });
    }

    return requestChangeViewBackup({
      context,
      node,
      privateKey,
      consensusContext,
    });
  }

  return { context };
};
