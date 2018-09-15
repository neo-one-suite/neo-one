import { PrivateKey, Transaction } from '@neo-one/client-core';
import { Node } from '@neo-one/node-core';
import { addTransaction } from './common';
import { ConsensusContext } from './ConsensusContext';
import { Context, RequestReceivedContext } from './context';
import { Result } from './types';

export const handleTransactionReceived = async ({
  context,
  node,
  privateKey,
  transaction,
  consensusContext,
}: {
  readonly context: Context;
  readonly node: Node;
  readonly privateKey: PrivateKey;
  readonly transaction: Transaction;
  readonly consensusContext: ConsensusContext;
}): Promise<Result<Context>> => {
  if (
    !(context instanceof RequestReceivedContext) ||
    context.transactions[transaction.hashHex] !== undefined ||
    !context.transactionHashesSet.has(transaction.hashHex)
  ) {
    return { context };
  }

  return addTransaction({
    context,
    node,
    privateKey,
    transaction,
    verify: true,
    consensusContext,
  });
};
