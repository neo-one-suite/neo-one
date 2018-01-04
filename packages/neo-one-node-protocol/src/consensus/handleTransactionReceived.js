/* @flow */
import { type PrivateKey, type Transaction } from '@neo-one/client-core';

import type { Result } from './types';
import type Node from '../Node';
import { type Context, RequestReceivedContext } from './context';

import { addTransaction } from './common';

export default async ({
  context,
  node,
  privateKey,
  transaction,
}: {|
  context: Context,
  node: Node,
  privateKey: PrivateKey,
  transaction: Transaction,
|}): Promise<Result<Context>> => {
  if (
    !(context instanceof RequestReceivedContext) ||
    context.transactions[transaction.hashHex] != null ||
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
  });
};
