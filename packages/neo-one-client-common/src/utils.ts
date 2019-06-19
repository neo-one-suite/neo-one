import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';

const USHORT_MAX_NUMBER = 65535;
const USHORT_MAX_NUMBER_PLUS_ONE = 65535 + 1;
const USHORT_MAX = new BN(USHORT_MAX_NUMBER);
const USHORT_MAX_PLUS_ONE = USHORT_MAX.addn(1);
const UINT_MAX_NUMBER = 4294967295;
const UINT_MAX = new BN(UINT_MAX_NUMBER);
const ZERO = new BN(0);
const ONE = new BN(1);
const NEGATIVE_ONE = new BN(-1);
const ONE_HUNDRED_MILLION = new BN(100000000);
const ONE_THOUSAND_TWENTY_FOUR = new BN(1024);

const fromSignedBuffer = (value: Buffer): BN =>
  value.length === 0 ? ZERO : new BN(value, 'le').fromTwos(value.length * 8);

const toSignedBuffer = (value: BN): Buffer => {
  if (value.isNeg()) {
    const negBuff = value.toTwos(value.byteLength() * 8).toArrayLike(Buffer, 'le');
    const negNormalValue = fromSignedBuffer(negBuff);

    const negPaddedBuff = value.toTwos((value.byteLength() + 1) * 8).toArrayLike(Buffer, 'le');

    return value.eq(negNormalValue) ? negBuff : negPaddedBuff;
  }

  const buff = value.toArrayLike(Buffer, 'le');
  const normalValue = fromSignedBuffer(buff);

  const paddedBuff = value.toArrayLike(Buffer, 'le', buff.length + 1);
  const paddedValue = fromSignedBuffer(paddedBuff);

  return normalValue.eq(paddedValue) ? buff : paddedBuff;
};

const bigNumberToBN = (value: BigNumber, decimals: number): BN => {
  const dBigNumber = new BigNumber(10 ** decimals);

  return new BN(value.times(dBigNumber).toString(), 10);
};

function lazy<Value>(getValue: () => Value): () => Value {
  let value: Value | undefined;

  return () => {
    if (value === undefined) {
      value = getValue();
    }

    return value;
  };
}

const randomUInt = (): number => Math.floor(Math.random() * UINT_MAX_NUMBER);

export const utils = {
  FD: new BN(0xfd),
  FFFF: new BN(0xffff),
  FFFFFFFF: new BN(0xffffffff),
  ZERO,
  ONE,
  TWO: new BN(2),
  NEGATIVE_ONE,
  INT_MAX_VALUE: new BN(2147483647),
  SATOSHI: ONE,
  NEGATIVE_SATOSHI: NEGATIVE_ONE,
  USHORT_MAX_NUMBER,
  USHORT_MAX_NUMBER_PLUS_ONE,
  USHORT_MAX,
  USHORT_MAX_PLUS_ONE,
  UINT_MAX_NUMBER,
  UINT_MAX,
  ONE_HUNDRED_MILLION,
  ONE_THOUSAND_TWENTY_FOUR,
  EIGHT: new BN(8),
  TEN: new BN(10),
  SIXTEEN: new BN(16),
  ZERO_BIG_NUMBER: new BigNumber(0),
  NEGATIVE_ONE_BIG_NUMBER: new BigNumber(-1),
  toSignedBuffer,
  fromSignedBuffer,
  bigNumberToBN,
  lazy,
  randomUInt,
};
