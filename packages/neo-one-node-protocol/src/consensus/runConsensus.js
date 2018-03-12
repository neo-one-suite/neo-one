/* @flow */
import BigNumber from 'bignumber.js';
import type BN from 'bn.js';
import {
  type PrivateKey,
  type Transaction,
  type UInt160,
  type UInt256Hex,
  Block,
  MinerTransaction,
  Output,
  PrepareRequestConsensusMessage,
  common,
  crypto,
  utils,
} from '@neo-one/client-core';

import _ from 'lodash';
import { utils as commonUtils } from '@neo-one/utils';

import type { Result } from './types';
import {
  type Context,
  RequestSentContext,
  SignatureSentContext,
} from './context';
import type { InternalOptions } from './Consensus';
import type Node from '../Node';
import type ConsensusContext from './ConsensusContext';

import {
  checkExpectedView,
  checkSignatures,
  initializeConsensusInitial,
  incrementExpectedView,
  signAndRelay,
  signAndRelayChangeView,
} from './common';

const createMinerTransaction = async ({
  node,
  feeAddress,
  transactions,
  nonce,
}: {|
  node: Node,
  feeAddress: UInt160,
  transactions: Array<Transaction>,
  nonce: BN,
|}) => {
  const networkFee = await Block.calculateNetworkFee(
    node.blockchain.feeContext,
    transactions,
  );
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
}: {|
  context: Context,
  node: Node,
  privateKey: PrivateKey,
  consensusContext: ConsensusContext,
|}): Result<Context> => {
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
    // eslint-disable-next-line
    timerSeconds: secondsPerBlock << (viewNumber + 1),
  };
};

export default async ({
  context: contextIn,
  node,
  options: { privateKey, feeAddress, privateNet },
  consensusContext,
}: {|
  context: Context,
  node: Node,
  options: InternalOptions,
  consensusContext: ConsensusContext,
|}): Promise<Result<Context>> => {
  let context = contextIn;
  if (context.type === 'primary' && !(context instanceof RequestSentContext)) {
    if (context instanceof SignatureSentContext) {
      context = context.cloneRequestSent();
    } else {
      const nonce = utils.randomUInt64();
      let transactions = commonUtils.values(node.memPool);
      const minerTransaction = await createMinerTransaction({
        node,
        feeAddress,
        transactions,
        nonce,
      });
      if (
        transactions.length >= node.blockchain.settings.maxTransactionsPerBlock
      ) {
        const networkFees = await Promise.all(
          transactions.map(async transaction => {
            const networkFee = await transaction.getNetworkFee(
              node.blockchain.feeContext,
            );
            return [transaction, new BigNumber(networkFee.toString(10))];
          }),
        );
        transactions = _.take(
          networkFees.sort(([first, a], [second, b]) =>
            b.div(second.size).comparedTo(a.div(first.size)),
          ),
          node.blockchain.settings.maxTransactionsPerBlock - 1,
          // eslint-disable-next-line
        ).map(([transaction, networkFee]) => transaction);
      }
      transactions.unshift(minerTransaction);
      const [previousHeader, validators] = await Promise.all([
        node.blockchain.header.get({ hashOrIndex: context.previousHash }),
        node.blockchain.getValidators(transactions),
      ]);

      context = new RequestSentContext({
        viewNumber: context.viewNumber,
        myIndex: context.myIndex,
        primaryIndex: context.primaryIndex,
        expectedView: context.expectedView,
        validators: context.validators,
        blockReceivedTimeSeconds: context.blockReceivedTimeSeconds,
        transactions: transactions.reduce((acc, transaction) => {
          acc[transaction.hashHex] = transaction;
          return acc;
        }, ({}: { [UInt256Hex]: Transaction })),
        signatures: [],
        header: {
          type: 'new',
          previousHash: context.previousHash,
          transactionHashes: transactions.map(
            transaction => transaction.hashHex,
          ),
          blockIndex: context.blockIndex,
          nonce,
          timestamp: Math.max(
            consensusContext.nowSeconds(),
            previousHeader.timestamp + 1,
          ),
          nextConsensus: crypto.getConsensusAddress(validators),
        },
      });

      const signatures = [];
      signatures[context.myIndex] = crypto.sign({
        message: context.header.message,
        privateKey,
      });
      context = context.cloneSignatures({ signatures });
    }

    signAndRelay({
      context,
      node,
      privateKey,
      consensusMessage: new PrepareRequestConsensusMessage({
        viewNumber: context.viewNumber,
        nonce: context.header.consensusData,
        nextConsensus: context.header.nextConsensus,
        transactionHashes: context.transactionHashes.map(hash =>
          common.hexToUInt256(hash),
        ),
        minerTransaction: (context.transactions[
          context.transactionHashes[0]
        ]: $FlowFixMe),
        signature: commonUtils.nullthrows(context.signatures[context.myIndex]),
      }),
    });

    if (privateNet) {
      return checkSignatures({ node, context });
    }

    const { secondsPerBlock } = node.blockchain.settings;
    return {
      context,
      // eslint-disable-next-line
      timerSeconds: secondsPerBlock << (context.viewNumber + 1),
    };
  } else if (
    context instanceof RequestSentContext ||
    context.type === 'backup'
  ) {
    return requestChangeView({
      context,
      node,
      privateKey,
      consensusContext,
    });
  }

  return { context };
};
