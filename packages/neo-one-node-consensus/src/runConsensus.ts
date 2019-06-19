import { common, crypto, PrivateKey, UInt160 } from '@neo-one/client-common';
import {
  Block,
  MinerTransaction,
  Node,
  Output,
  PrepareRequestConsensusMessage,
  Transaction,
  utils,
} from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import _ from 'lodash';
import {
  checkExpectedView,
  checkSignatures,
  incrementExpectedView,
  initializeConsensusInitial,
  signAndRelay,
  signAndRelayChangeView,
} from './common';
import { InternalOptions } from './Consensus';
import { ConsensusContext } from './ConsensusContext';
import { Context, RequestSentContext, SignatureSentContext } from './context';
import { Result } from './types';

const createMinerTransaction = async ({
  node,
  feeAddress,
  transactions,
  nonce,
}: {
  readonly node: Node;
  readonly feeAddress: UInt160;
  readonly transactions: readonly Transaction[];
  readonly nonce: BN;
}) => {
  const networkFee = await Block.calculateNetworkFee(node.blockchain.feeContext, transactions);

  const outputs = networkFee.isZero()
    ? []
    : [
        new Output({
          asset: node.blockchain.settings.utilityToken.hash,
          value: networkFee,
          address: feeAddress,
        }),
      ];

  return new MinerTransaction({
    nonce: nonce.mod(utils.UINT_MAX.addn(1)).toNumber(),
    outputs,
  });
};

const requestChangeView = ({
  context: contextIn,
  node,
  privateKey,
  consensusContext,
}: {
  readonly context: Context;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly consensusContext: ConsensusContext;
}): Result<Context> => {
  let context = contextIn;

  context = context.cloneExpectedView({
    expectedView: incrementExpectedView(context),
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

  const { secondsPerBlock } = node.blockchain.settings;

  return {
    context,
    // tslint:disable-next-line no-bitwise
    timerSeconds: secondsPerBlock << (viewNumber + 1),
  };
};

export const runConsensus = async ({
  context,
  node,
  options: { privateKey, feeAddress, privateNet },
  consensusContext,
}: {
  readonly context: Context;
  readonly node: Node;
  readonly options: InternalOptions;
  readonly consensusContext: ConsensusContext;
}): Promise<Result<Context>> => {
  if (context.type === 'primary' && !(context instanceof RequestSentContext)) {
    let requestSentContext: RequestSentContext;
    if (context instanceof SignatureSentContext) {
      requestSentContext = context.cloneRequestSent();
    } else {
      const nonce = utils.randomUInt64();
      let mutableTransactions = Object.values(node.memPool);
      const minerTransaction = await createMinerTransaction({
        node,
        feeAddress,
        transactions: mutableTransactions,
        nonce,
      });

      if (mutableTransactions.length >= node.blockchain.settings.maxTransactionsPerBlock) {
        const mutableNetworkFees = await Promise.all(
          mutableTransactions.map<Promise<[Transaction, BigNumber]>>(async (transaction) => {
            const networkFee = await transaction.getNetworkFee(node.blockchain.feeContext);

            return [transaction, new BigNumber(networkFee.toString(10))];
          }),
        );

        mutableNetworkFees.sort(([first, a], [second, b]) => b.div(second.size).comparedTo(a.div(first.size)));
        mutableTransactions = _.take(mutableNetworkFees, node.blockchain.settings.maxTransactionsPerBlock - 1)
          // tslint:disable-next-line no-unused
          .map(([transaction, _unused]) => transaction);
      }
      mutableTransactions.unshift(minerTransaction);
      const [previousHeader, validators] = await Promise.all([
        node.blockchain.header.get({ hashOrIndex: context.previousHash }),
        node.blockchain.getValidators(mutableTransactions),
      ]);

      const newContext = new RequestSentContext({
        viewNumber: context.viewNumber,
        myIndex: context.myIndex,
        primaryIndex: context.primaryIndex,
        expectedView: context.expectedView,
        validators: context.validators,
        blockReceivedTimeSeconds: context.blockReceivedTimeSeconds,
        transactions: mutableTransactions.reduce<{ [key: string]: Transaction }>(
          (acc, transaction) => ({
            ...acc,
            [transaction.hashHex]: transaction,
          }),
          {},
        ),
        signatures: [],
        header: {
          type: 'new',
          previousHash: context.previousHash,
          transactionHashes: mutableTransactions.map((transaction) => transaction.hashHex),

          blockIndex: context.blockIndex,
          nonce,
          timestamp: Math.max(consensusContext.nowSeconds(), previousHeader.timestamp + 1),

          nextConsensus: crypto.getConsensusAddress(validators),
        },
      });

      const mutableSignatures = [];
      mutableSignatures[newContext.myIndex] = crypto.sign({
        message: newContext.header.message,
        privateKey,
      });

      requestSentContext = newContext.cloneSignatures({ signatures: mutableSignatures });
    }

    if (privateNet) {
      return checkSignatures({ node, context: requestSentContext });
    }

    signAndRelay({
      context: requestSentContext,
      node,
      privateKey,
      consensusMessage: new PrepareRequestConsensusMessage({
        viewNumber: requestSentContext.viewNumber,
        nonce: requestSentContext.header.consensusData,
        nextConsensus: requestSentContext.header.nextConsensus,
        transactionHashes: requestSentContext.transactionHashes.map((hash) => common.hexToUInt256(hash)),
        minerTransaction: commonUtils.nullthrows(
          requestSentContext.transactions[requestSentContext.transactionHashes[0]],
        ) as MinerTransaction,
        signature: commonUtils.nullthrows(requestSentContext.signatures[requestSentContext.myIndex]),
      }),
    });

    const { secondsPerBlock } = node.blockchain.settings;

    return {
      context: requestSentContext,
      // tslint:disable-next-line no-bitwise
      timerSeconds: secondsPerBlock << (requestSentContext.viewNumber + 1),
    };
  }

  if (context instanceof RequestSentContext || context.type === 'backup') {
    return requestChangeView({
      context,
      node,
      privateKey,
      consensusContext,
    });
  }

  return { context };
};
