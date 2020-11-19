import { Block, ChangeViewReason, ConsensusContext, Node } from '@neo-one/node-core';
import { checkCommits } from './checkPayload';
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

// export const runConsensusOld = async ({
//   context,
//   node,
//   options: { privateKey, privateNet },
//   timerContext,
// }: {
//   readonly context: ConsensusContext;
//   readonly node: Node;
//   readonly options: InternalOptions;
//   readonly timerContext: TimerContext;
// }): Promise<Result> => {
//   if (context.type === 'primary' && !(context instanceof RequestSentContext)) {
//     let requestSentContext: RequestSentContext;
//     if (context instanceof SignatureSentContext) {
//       requestSentContext = context.cloneRequestSent();
//     } else {
//       const newNonce = utils.randomUInt64();
//       let mutableTransactions = Object.values(node.memPool);

//       if (mutableTransactions.length >= node.blockchain.settings.memoryPoolMaxTransactions) {
//         const mutableNetworkFees = await Promise.all(
//           mutableTransactions.map<Promise<[Transaction, BigNumber]>>(async (transaction) => {
//             const networkFee = await transaction.getNetworkFee(node.blockchain.feeContext);

//             return [transaction, new BigNumber(networkFee.toString(10))];
//           }),
//         );

//         mutableNetworkFees.sort(([first, a], [second, b]) => b.div(second.size).comparedTo(a.div(first.size)));
//         mutableTransactions = _.take(mutableNetworkFees, node.blockchain.settings.memoryPoolMaxTransactions - 1)
//           // tslint:disable-next-line no-unused
//           .map(([transaction, _unused]) => transaction);
//       }
//       const [previousHeader, validators] = await Promise.all([
//         node.blockchain.getHeader(context.previousHash),
//         node.blockchain.getValidators(),
//       ]);

//       if (previousHeader === undefined) {
//         // TODO: real error or implementy `getHeader` and `tryGetHeader` separately.
//         throw new Error('we expect previousHeader to be defined always');
//       }

//       const newContext = new RequestSentContext({
//         viewNumber: context.viewNumber,
//         myIndex: context.myIndex,
//         primaryIndex: context.primaryIndex,
//         expectedView: context.expectedView,
//         validators: context.validators,
//         blockReceivedTimeMS: context.blockReceivedTimeMS,
//         verificationContext: context.verificationContext,
//         transactions: mutableTransactions.reduce<{ [key: string]: Transaction }>(
//           (acc, transaction) => ({
//             ...acc,
//             [transaction.hashHex]: transaction,
//           }),
//           {},
//         ),
//         signatures: [],
//         header: {
//           type: 'new',
//           previousHash: context.previousHash,
//           transactionHashes: mutableTransactions.map((transaction) => transaction.hashHex),

//           blockIndex: context.blockIndex,
//           nonce: newNonce,
//           timestamp: Math.max(timerContext.nowMilliseconds(), previousHeader.timestamp.toNumber() + 1),

//           nextConsensus: crypto.getConsensusAddress(validators),
//         },
//       });

//       const mutableSignatures = [];
//       mutableSignatures[newContext.myIndex] = crypto.sign({
//         message: newContext.header.message,
//         privateKey,
//       });

//       requestSentContext = newContext.cloneSignatures({ signatures: mutableSignatures });
//     }

//     if (privateNet) {
//       return checkSignatures({ node, context: requestSentContext });
//     }

//     const nonce = requestSentContext.header.consensusData?.nonce;
//     if (nonce === undefined) {
//       // TODO: real error
//       throw new Error('we expect nonce to be defined');
//     }

//     signAndRelay({
//       context: requestSentContext,
//       node,
//       privateKey,
//       consensusMessage: new PrepareRequestConsensusMessage({
//         viewNumber: requestSentContext.viewNumber,
//         nonce,
//         transactionHashes: requestSentContext.transactionHashes.map((hash) => common.hexToUInt256(hash)),
//         // signature: commonUtils.nullthrows(requestSentContext.signatures[requestSentContext.myIndex]),
//       }),
//     });

//     const { millisecondsPerBlock } = node.blockchain.settings;

//     return {
//       context: requestSentContext,
//       // tslint:disable-next-line no-bitwise
//       timerSeconds: secondsPerBlock << (requestSentContext.viewNumber + 1),
//     };
//   }

//   if (context instanceof RequestSentContext || context.type === 'backup') {
//     return requestChangeView({
//       context,
//       node,
//       privateKey,
//       timerContext,
//     });
//   }

//   return { context };
// };
