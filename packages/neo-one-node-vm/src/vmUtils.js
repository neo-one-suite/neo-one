/* @flow */
import BN from 'bn.js';

import _ from 'lodash';
import bitwise from 'bitwise';
import { utils } from '@neo-one/client-core';

import { type ExecutionContext } from './constants';
import { NumberTooLargeError, ReadOnlyStorageContextError } from './errors';
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

const toStorageContext = ({
  context,
  value,
  write = false,
}: {|
  context: ExecutionContext,
  value: StackItem,
  write?: boolean,
|}): StorageContextStackItem => {
  const item = value.asStorageContextStackItem({
    currentBlockIndex: context.blockchain.currentBlockIndex,
    vm: context.blockchain.settings.vm,
    scriptHash: context.scriptHash,
    callingScriptHash: context.callingScriptHash,
    entryScriptHash: context.entryScriptHash,
  });

  if (write && item.isReadOnly) {
    throw new ReadOnlyStorageContextError(context);
  }

  return item;
};

const leftPad = (value: Buffer, length: number): Buffer => {
  if (value.length === 0) {
    return Buffer.alloc(0, length);
  }

  const lastByte = bitwise.byte.read(value[value.length - 1]);

  return Buffer.concat([
    value.slice(0, -1),
    bitwise.buffer.create(
      lastByte
        .slice(0, -1)
        .concat(_.range((length - value.length) * 8).map(() => 0))
        .concat([lastByte[7]]),
    ),
  ]);
};

const bitwiseOp = (
  func: (a: Buffer, b: Buffer) => Buffer,
  a: BN,
  b: BN,
): BN => {
  let aBuffer = utils.toSignedBuffer(a);
  let bBuffer = utils.toSignedBuffer(b);

  if (aBuffer.length < bBuffer.length) {
    aBuffer = leftPad(aBuffer, bBuffer.length);
  } else if (aBuffer.length > bBuffer.length) {
    bBuffer = leftPad(bBuffer, aBuffer.length);
  }

  return utils.fromSignedBuffer(func(aBuffer, bBuffer));
};

export default {
  toNumber,
  toStorageContext,
  shiftLeft,
  shiftRight,
  bitwiseOp,
};
