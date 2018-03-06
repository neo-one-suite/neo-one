/* @flow */
import BN from 'bn.js';

import { utils } from '@neo-one/client-core';

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

const shiftLeft = (value: BN, shift: BN): BN => value.mul(utils.TWO.pow(shift));

const shiftRight = (value: BN, shift: BN): BN => {
  let result = utils.ZERO;
  if (new BN(utils.toSignedBuffer(value).length * 8).gt(shift)) {
    result = value.div(utils.TWO.pow(shift));
    if (result.mul(shift).lt(utils.ZERO)) {
      result = result.sub(utils.ONE);
    }
  }

  if (result.eq(utils.ZERO) && value.isNeg()) {
    result = utils.NEGATIVE_ONE;
  }
  return result;
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
  shiftLeft,
  shiftRight,
};
