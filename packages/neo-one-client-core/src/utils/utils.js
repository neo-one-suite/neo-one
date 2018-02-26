/* @flow */
import BigNumber from 'bignumber.js';
import BN from 'bn.js';

import _ from 'lodash';
import crypto from 'crypto';
import { utils as commonUtils } from '@neo-one/utils';

import equals from './equals';
import lazy from './lazy';
import lazyAsync from './lazyAsync';
import lazyOrValue from './lazyOrValue';
import weightedAverage from './weightedAverage';
import weightedFilter from './weightedFilter';

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
    return value.toTwos((value.byteLength() + 1) * 8).toArrayLike(Buffer, 'le');
  }

  const buff = value.toArrayLike(Buffer, 'le');
  const normalValue = fromSignedBuffer(buff);

  const paddedBuff = value.toArrayLike(Buffer, 'le', buff.length + 1);
  const paddedValue = fromSignedBuffer(paddedBuff);

  return normalValue.eq(paddedValue) ? buff : paddedBuff;
};

const getBoolean = (value: Buffer): boolean => value.some(byte => byte !== 0);

const booleanToBuffer = (value: boolean): Buffer =>
  Buffer.from([value ? 1 : 0]);

const toASCII = (bytes: Buffer) => {
  let result = '';
  for (let i = 0; i < bytes.length; i += 1) {
    result += String.fromCharCode(bytes.readUInt8(i));
  }

  return result;
};

const toUTF8 = (bytes: Buffer) => bytes.toString('utf8');

const reverse = (src: Buffer): Buffer => {
  const out = Buffer.allocUnsafe(src.length);
  for (let i = 0, j = src.length - 1; i <= j; i += 1, j -= 1) {
    out[i] = src[j];
    out[j] = src[i];
  }

  return out;
};

const calculateClaimAmount = async ({
  coins,
  decrementInterval,
  generationAmount,
  getSystemFee,
}: {|
  coins: Array<{|
    value: BN,
    startHeight: number,
    endHeight: number,
  |}>,
  decrementInterval: number,
  generationAmount: Array<number>,
  getSystemFee: (index: number) => Promise<BN>,
|}): Promise<BN> => {
  const grouped = commonUtils.values(
    _.groupBy(coins, coin => `${coin.startHeight}:${coin.endHeight}`),
  );
  const claimed = await Promise.all(
    grouped.map(async coinsGroup => {
      const { startHeight, endHeight } = coinsGroup[0];

      let amount = ZERO;
      let ustart = Math.floor(startHeight / decrementInterval);
      if (ustart < generationAmount.length) {
        let istart = startHeight % decrementInterval;
        let uend = Math.floor(endHeight / decrementInterval);
        let iend = endHeight % decrementInterval;
        if (uend >= generationAmount.length) {
          uend = generationAmount.length;
          iend = 0;
        }

        if (iend === 0) {
          uend -= 1;
          iend = decrementInterval;
        }

        while (ustart < uend) {
          amount = amount.addn(
            (decrementInterval - istart) * generationAmount[ustart],
          );
          ustart += 1;
          istart = 0;
        }

        amount = amount.addn((iend - istart) * generationAmount[ustart]);
      }

      const [sysFeeEnd, sysFeeStart] = await Promise.all([
        getSystemFee(endHeight - 1),
        startHeight === 0
          ? Promise.resolve(ZERO)
          : getSystemFee(startHeight - 1),
      ]);

      amount = amount.add(sysFeeEnd.sub(sysFeeStart).div(ONE_HUNDRED_MILLION));
      const totalValue = coinsGroup.reduce(
        (acc, { value }) => acc.add(value),
        ZERO,
      );
      return [totalValue, amount];
    }),
  );

  return claimed.reduce(
    (acc, [value, amount]) =>
      acc.add(value.div(ONE_HUNDRED_MILLION).mul(amount)),
    ZERO,
  );
};

const randomUInt = (): number => Math.floor(Math.random() * UINT_MAX_NUMBER);

const randomUInt64 = (): BN =>
  new BN(crypto.randomBytes(8).toString('hex'), 16);

export default {
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
  toSignedBuffer,
  fromSignedBuffer,
  getBoolean,
  booleanToBuffer,
  toASCII,
  toUTF8,
  reverse,
  calculateClaimAmount,
  randomUInt,
  randomUInt64,
  equals,
  lazy,
  lazyAsync,
  lazyOrValue,
  weightedAverage,
  weightedFilter,
};
