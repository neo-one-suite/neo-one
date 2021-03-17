import { ECPoint, PrivateKey, VerifyResultModel } from '@neo-one/client-common';
import {
  Blockchain,
  ChangeViewConsensusMessage,
  ChangeViewReason,
  ConsensusContext,
  Node,
  Transaction,
  TransactionVerificationContext,
} from '@neo-one/node-core';
import { utils } from '@neo-one/utils';
import { checkPreparations, checkPrepareResponse } from './checkPayload';
import { getInitialContext, reset } from './context';
import { makeChangeView, makePrepareRequest, makeRecoveryRequest } from './makePayload';
import { TimerContext } from './TimerContext';
import { Result } from './types';

export const sendPrepareRequest = async ({
  node,
  privateKey,
  context: contextIn,
}: {
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly context: ConsensusContext;
}): Promise<Result> => {
  let context = contextIn;
  const { context: prepareRequestContext, payload } = await makePrepareRequest({ node, privateKey, context });
  context = prepareRequestContext;

  node.relayConsensusPayload(payload);

  if (context.validators.length === 1) {
    const { context: checkPreparationContext } = await checkPreparations(context, node, privateKey);
    context = checkPreparationContext;
  }

  // Dan note: it seems to me anything we would send the node here it already knows about
  // since our mempool isn't as disjointed like C# land.
  // if ((context.transactionHashes ?? 0) > 0) {
  //   node.sendInv(/*...*/);
  // }

  return { context };
};

export const requestRecovery = async ({
  node,
  privateKey,
  context,
}: {
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly context: ConsensusContext;
}) => {
  const payload = await makeRecoveryRequest({ node, context, privateKey });
  node.relayConsensusPayload(payload);
};

export const checkExpectedView = ({
  context,
  viewNumber,
}: {
  readonly context: ConsensusContext;
  readonly viewNumber: number;
}) => {
  const messages = context.changeViewPayloads
    .filter(utils.notNull)
    .map((p) => context.getMessage<ChangeViewConsensusMessage>(p));

  return context.viewNumber < viewNumber || messages.filter((p) => p.newViewNumber >= viewNumber).length >= context.M;
};

export const requestChangeView = async ({
  node,
  context: contextIn,
  timerContext,
  privateKey,
  reason,
  isRecovering,
}: {
  readonly node: Node;
  readonly context: ConsensusContext;
  readonly timerContext: TimerContext;
  readonly privateKey: PrivateKey;
  readonly reason: ChangeViewReason;
  readonly isRecovering: boolean;
}): Promise<Result> => {
  let context = contextIn;
  if (context.watchOnly) {
    return { context };
  }

  const expectedView = context.viewNumber + 1;
  if (context.countCommitted + context.countFailed > context.F) {
    await requestRecovery({ node, privateKey, context });

    return { context };
  }

  const { context: changeViewContext, payload } = await makeChangeView({
    node,
    context,
    privateKey,
    reason,
  });

  context = changeViewContext;

  node.relayConsensusPayload(payload);

  if (checkExpectedView({ context, viewNumber: expectedView }) && !context.watchOnly) {
    const messages = context.changeViewPayloads.map((p) =>
      p === undefined ? undefined : context.getMessage<ChangeViewConsensusMessage>(p),
    );
    const message = messages[context.myIndex];
    if (message === undefined || message.newViewNumber < expectedView) {
      const { context: moreChangeViewContext, payload: changeViewPayload } = await makeChangeView({
        node,
        privateKey,
        context,
        reason: ChangeViewReason.ChangeAgreement,
      });
      context = moreChangeViewContext;
      node.relayConsensusPayload(changeViewPayload);
    }

    return initializeConsensus({
      blockchain: node.blockchain,
      privateKey,
      context,
      viewNumber: expectedView,
      timerContext,
      isRecovering,
    });
  }

  return { context };
};

export async function initializeConsensus({
  blockchain,
  privateKey,
  context: contextIn,
  timerContext,
  viewNumber,
  isRecovering,
}: {
  readonly blockchain: Blockchain;
  readonly privateKey: PrivateKey;
  readonly context: ConsensusContext;
  readonly timerContext: TimerContext;
  readonly viewNumber: number;
  readonly isRecovering: boolean;
}): Promise<Result> {
  const { context } = await reset({
    blockchain,
    privateKey,
    context: contextIn,
    viewNumber,
  });

  if (context.watchOnly) {
    return { context };
  }

  return initializeConsensusCommon({
    context,
    blockchain,
    timerContext,
    isRecovering,
  });
}

function initializeConsensusCommon({
  context,
  blockchain,
  timerContext,
  isRecovering,
}: {
  readonly context: ConsensusContext;
  readonly blockchain: Blockchain;
  readonly timerContext: TimerContext;
  readonly isRecovering: boolean;
}): Result {
  const { millisecondsPerBlock } = blockchain.settings;

  if (context.isPrimary && !isRecovering) {
    return {
      context,
      timerMS: Math.max(0, millisecondsPerBlock - (timerContext.nowMilliseconds() - context.blockReceivedTimeMS)),
    };
  }

  return {
    context,
    // tslint:disable-next-line no-bitwise
    timerMS: millisecondsPerBlock << (context.viewNumber + 1),
  };
}

export async function initializeNewConsensus({
  blockchain,
  publicKey,
  privateKey,
  timerContext,
  verificationContext,
}: {
  readonly blockchain: Blockchain;
  readonly publicKey: ECPoint;
  readonly privateKey: PrivateKey;
  readonly timerContext: TimerContext;
  readonly verificationContext: TransactionVerificationContext;
}) {
  const validators = await blockchain.getValidators();
  const initialContext = getInitialContext({
    blockchain,
    publicKey,
    validators,
    verificationContext,
  });

  return initializeConsensus({
    blockchain,
    privateKey,
    context: initialContext,
    timerContext,
    viewNumber: initialContext.viewNumber,
    isRecovering: false,
  });
}

export const addTransaction = async ({
  context: contextIn,
  node,
  privateKey,
  transaction,
  verify,
  timerContext,
  isRecovering,
}: {
  readonly context: ConsensusContext;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly transaction: Transaction;
  readonly verify: boolean;
  readonly timerContext: TimerContext;
  readonly isRecovering: boolean;
}): Promise<Result> => {
  let context = contextIn;
  const { blockchain } = node;
  const tx = await blockchain.getTransaction(transaction.hash);
  if (tx !== undefined) {
    return { context };
  }
  if (verify) {
    const result = await blockchain.verifyTransaction(transaction, context.transactions, context.verificationContext);

    if (result !== VerifyResultModel.Succeed) {
      return requestChangeView({
        context,
        node,
        privateKey,
        timerContext,
        reason:
          result === VerifyResultModel.PolicyFail ? ChangeViewReason.TxRejectedByPolicy : ChangeViewReason.TxInvalid,
        isRecovering,
      });
    }
  }

  context = context.clone({
    transactions: {
      ...context.transactions,
      [transaction.hashHex]: transaction,
    },
  });

  context.verificationContext.addTransaction(transaction);

  return checkPrepareResponse({
    context,
    node,
    privateKey,
    timerContext,
    isRecovering,
  });
};
