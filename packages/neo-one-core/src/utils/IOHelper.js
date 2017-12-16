/* @flow */
import BN from 'bn.js';

import { utils as commonUtils } from '@neo-one/utils';

import { InvalidFormatError } from '../errors';

import common, { type ECPoint } from '../common';
import utils from './utils';

const sizeOfUInt8 = 1;
const sizeOfBoolean = 1;
const sizeOfUInt16LE = 2;
const sizeOfUInt32LE = 4;
const sizeOfUInt64LE = 8;

const sizeOfUInt160 = common.UINT160_BUFFER_BYTES;
const sizeOfUInt256 = common.UINT256_BUFFER_BYTES;
const sizeOfECPoint = (ecPoint: ECPoint) => {
  if (common.ecPointIsInfinity(ecPoint)) {
    return 1;
  }

  return common.ECPOINT_BUFFER_BYTES;
};
const sizeOfFixed8 = 8;

const sizeOfVarUIntLE = (valueIn: number | BN): number => {
  const value = new BN(valueIn);
  if (value.lt(utils.ZERO)) {
    throw new InvalidFormatError();
  }

  if (value.lt(utils.FD)) {
    return sizeOfUInt8;
  } else if (value.lte(utils.FFFF)) {
    return sizeOfUInt8 + sizeOfUInt16LE;
  } else if (value.lte(utils.FFFFFFFF)) {
    return sizeOfUInt8 + sizeOfUInt32LE;
  }

  return sizeOfUInt8 + sizeOfUInt64LE;
};

const sizeOfVarBytesLE = (value: Buffer): number =>
  sizeOfVarUIntLE(value.length) + value.length;

const sizeOfVarString = (value: string): number =>
  sizeOfVarBytesLE(Buffer.from(value, 'utf8'));

const sizeOfFixedString = (length: number): number => length;

function sizeOfArray<T>(
  values: Array<T>,
  sizeOf: (value: T) => number,
): number {
  return values.reduce(
    (acc, value) => acc + sizeOf(value),
    sizeOfVarUIntLE(values.length),
  );
}

function sizeOfObject<K, V>(
  obj: { [key: K]: V },
  sizeOf: (key: K, value: V) => number,
): number {
  const entries = commonUtils.entries(obj);
  return entries.reduce(
    (acc, [key, value]) => acc + sizeOf(key, value),
    entries.length,
  );
}

export default {
  sizeOfUInt8,
  sizeOfBoolean,
  sizeOfUInt16LE,
  sizeOfUInt32LE,
  sizeOfUInt64LE,
  sizeOfVarBytesLE,
  sizeOfVarString,
  sizeOfFixedString,
  sizeOfArray,
  sizeOfObject,
  sizeOfUInt160,
  sizeOfUInt256,
  sizeOfECPoint,
  sizeOfFixed8,
};
