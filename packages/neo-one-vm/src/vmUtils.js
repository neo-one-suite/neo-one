/* @flow */
import type BN from 'bn.js';

import { type ExecutionContext } from './constants';
import { NumberTooLargeError } from './errors';
import { type StackItem, StorageContextStackItem } from './stackItem';

const toNumber = (context: ExecutionContext, value: BN): number => {
  try {
    return value.toNumber();
  } catch (error) {
    throw new NumberTooLargeError(context, value);
  }
};

const toStorageContext = (
  context: ExecutionContext,
  value: StackItem,
): StorageContextStackItem =>
  value.asStorageContextStackItem({
    currentBlockIndex: context.blockchain.currentBlockIndex,
    vm: context.blockchain.settings.vm,
    scriptHash: context.scriptHash,
    callingScriptHash: context.callingScriptHash,
    entryScriptHash: context.entryScriptHash,
  });

export default {
  toNumber,
  toStorageContext,
};
