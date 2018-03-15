/* @flow */
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

import { InvalidFormatError } from './errors';

import utils from './utils/utils';

const add0x = (value: string) => `0x${value}`;
const strip0x = (value: string) =>
  value.startsWith('0x') ? value.substring(2) : value;

export opaque type UInt160 = Buffer;
export opaque type UInt160Hex: string = string;

const UINT160_BUFFER_BYTES = 20;

const bufferToUInt160 = (value: Buffer): UInt160 => {
  if (value.length !== UINT160_BUFFER_BYTES) {
    throw new InvalidFormatError();
  }

  return value;
};

const uInt160ToHex = (value: UInt160): UInt160Hex =>
  add0x(utils.reverse(value).toString('hex'));

const hexToUInt160 = (value: UInt160Hex | UInt160): UInt160 =>
  typeof value === 'string'
    ? bufferToUInt160(utils.reverse(Buffer.from(strip0x(value), 'hex')))
    : bufferToUInt160(value);

const uInt160ToBuffer = (value: UInt160 | UInt160Hex): Buffer =>
  typeof value === 'string' ? hexToUInt160(value) : value;

const uInt160ToString = (value: UInt160 | UInt160Hex): string =>
  typeof value === 'string' ? value : uInt160ToHex(value);

const stringToUInt160 = (value: string): UInt160 => hexToUInt160(value);

const uInt160Equal = (a: UInt160, b: UInt160) => a.equals(b);

const isUInt160 = (value: mixed): boolean =>
  value instanceof Buffer && value.length === UINT160_BUFFER_BYTES;

const asUInt160 = (value: mixed): UInt160 => {
  if (value instanceof Buffer) {
    return bufferToUInt160(value);
  }

  throw new InvalidFormatError();
};

const ZERO_UINT160 = (Buffer.alloc(20, 0): UInt160);

export opaque type UInt256 = Buffer;
export opaque type UInt256Hex: string = string;

const UINT256_BUFFER_BYTES = 32;
const ZERO_UINT256 = (Buffer.alloc(UINT256_BUFFER_BYTES, 0): UInt256);

const bufferToUInt256 = (value: Buffer): UInt256 => {
  if (value.length !== UINT256_BUFFER_BYTES) {
    throw new InvalidFormatError();
  }

  return value;
};

const uInt256ToHex = (value: UInt256): UInt256Hex =>
  add0x(utils.reverse(value).toString('hex'));

const hexToUInt256 = (value: UInt256Hex | UInt256): UInt256 =>
  typeof value === 'string'
    ? bufferToUInt256(utils.reverse(Buffer.from(strip0x(value), 'hex')))
    : bufferToUInt256(value);

const uInt256ToBuffer = (value: UInt256 | UInt256Hex): Buffer =>
  typeof value === 'string' ? hexToUInt256(value) : value;

const uInt256ToString = (value: UInt256 | UInt256Hex): string =>
  typeof value === 'string' ? value : uInt256ToHex(value);

const stringToUInt256 = (value: string): UInt256 => hexToUInt256(value);

const uInt256Equal = (a: UInt256, b: UInt256) => a.equals(b);

const isUInt256 = (value: mixed): boolean =>
  value instanceof Buffer && value.length === UINT256_BUFFER_BYTES;

const asUInt256 = (value: mixed): UInt256 => {
  if (value instanceof Buffer) {
    return bufferToUInt256(value);
  }

  throw new InvalidFormatError();
};

const toUInt32LE = (bytes: UInt256): number =>
  new BN(uInt256ToBuffer(bytes).slice(0, 4), 'le').toNumber();

export opaque type ECPointBase = Buffer;
export opaque type ECPointInfinity = Buffer;
export type ECPoint = ECPointBase | ECPointInfinity;
export opaque type ECPointHex: string = string;

// Encoded compressed ECPoint
const ECPOINT_BUFFER_BYTES = 33;
const ECPOINT_INFINITY_BYTE = 0x00;
const ECPOINT_INFINITY = (Buffer.from([
  ECPOINT_INFINITY_BYTE,
]): ECPointInfinity);

const bufferToECPoint = (value: Buffer): ECPoint => {
  if (value.length !== ECPOINT_BUFFER_BYTES) {
    if (value.length === 1 && value.equals(ECPOINT_INFINITY)) {
      return value;
    }

    throw new InvalidFormatError();
  }

  return value;
};

const ecPointToHex = (value: ECPoint | ECPointHex): ECPointHex =>
  typeof value === 'string' ? value : value.toString('hex');

const hexToECPoint = (value: ECPoint | ECPointHex): ECPoint =>
  bufferToECPoint(
    typeof value === 'string' ? Buffer.from(value, 'hex') : value,
  );

const ecPointToBuffer = (value: ECPoint | ECPointHex): Buffer =>
  typeof value === 'string' ? hexToECPoint(value) : value;

const ecPointToString = (value: ECPoint | ECPointHex): string =>
  typeof value === 'string' ? value : ecPointToHex(value);

const stringToECPoint = (value: string): ECPoint => hexToECPoint(value);

const ecPointEqual = (a: ECPoint, b: ECPoint): boolean => a.equals(b);

const ecPointCompare = (a: ECPoint | ECPointHex, b: ECPoint | ECPointHex) => {
  const aHex = ecPointToHex(a);
  const bHex = ecPointToHex(b);
  if (aHex < bHex) {
    return -1;
  } else if (aHex > bHex) {
    return 1;
  }

  return 0;
};

const ecPointIsInfinity = (value: ECPoint): boolean =>
  value.equals(ECPOINT_INFINITY);

const isECPoint = (value: mixed): boolean =>
  value instanceof Buffer &&
  (value.length === ECPOINT_BUFFER_BYTES || value.equals(ECPOINT_INFINITY));

const asECPoint = (value: mixed): ECPoint => {
  if (value instanceof Buffer) {
    return bufferToECPoint(value);
  }

  throw new InvalidFormatError();
};

export opaque type PrivateKey = Buffer;
export opaque type PrivateKeyHex: string = string;

const PRIVATE_KEY_BUFFER_BYTES = 32;

const bufferToPrivateKey = (value: Buffer): PrivateKey => {
  if (value.length !== PRIVATE_KEY_BUFFER_BYTES) {
    throw new InvalidFormatError();
  }

  return value;
};

const privateKeyToHex = (value: PrivateKey | PrivateKeyHex): PrivateKeyHex =>
  typeof value === 'string' ? value : value.toString('hex');

const hexToPrivateKey = (value: PrivateKey | PrivateKeyHex): PrivateKey =>
  bufferToPrivateKey(
    typeof value === 'string' ? Buffer.from(value, 'hex') : value,
  );

const privateKeyToBuffer = (value: PrivateKey | PrivateKeyHex): Buffer =>
  typeof value === 'string' ? hexToPrivateKey(value) : value;

const privateKeyToString = (value: PrivateKey | PrivateKeyHex): string =>
  typeof value === 'string' ? value : ecPointToHex(value);

const stringToPrivateKey = (value: string): PrivateKey =>
  hexToPrivateKey(value);

const fixedFromDecimal = (
  value: number | string | BigNumber | BN,
  decimals: number,
) => {
  if (value instanceof BN) {
    return value;
  }

  const d = new BN(10 ** decimals);
  if (typeof value === 'number') {
    return new BN(value).mul(d);
  }

  let valueBigNumber = value;
  if (typeof value === 'string') {
    valueBigNumber = new BigNumber(value);
  }

  const dBigNumber = new BigNumber(d.toString(10));
  // $FlowFixMe
  return new BN(valueBigNumber.times(dBigNumber).toString(), 10);
};

const D8 = new BN(100000000);

const fixed8FromDecimal = (value: number | string | BigNumber | BN): BN =>
  fixedFromDecimal(value, 8);

const fixedToDecimal = (value: BN, decimals: number): BigNumber => {
  const dBigNumber = new BigNumber(10 ** decimals);
  return new BigNumber(value.toString(10)).div(dBigNumber);
};

const fixed8ToDecimal = (bn: BN): BigNumber => fixedToDecimal(bn, 8);

const NEGATIVE_SATOSHI_FIXED8 = new BN(-1);
const TEN_FIXED8 = fixed8FromDecimal(10);
const ONE_HUNDRED_FIXED8 = fixed8FromDecimal(100);
const FOUR_HUNDRED_FIXED8 = fixed8FromDecimal(400);
const FIVE_HUNDRED_FIXED8 = fixed8FromDecimal(500);
const ONE_THOUSAND_FIXED8 = fixed8FromDecimal(1000);
const FIVE_THOUSAND_FIXED8 = fixed8FromDecimal(5000);
const TEN_THOUSAND_FIXED8 = fixed8FromDecimal(10000);
const ONE_HUNDRED_MILLION_FIXED8 = fixed8FromDecimal(100000000);

export default {
  D8,
  NEO_ADDRESS_VERSION: 23,
  NEO_PRIVATE_KEY_VERSION: 0x80,
  ECPOINT_BUFFER_BYTES,
  ECPOINT_INFINITY,
  ECPOINT_INFINITY_BYTE,
  PRIVATE_KEY_BUFFER_BYTES,
  UINT160_BUFFER_BYTES,
  UINT256_BUFFER_BYTES,
  ZERO_UINT160,
  ZERO_UINT256,
  NEGATIVE_SATOSHI_FIXED8,
  TEN_FIXED8,
  ONE_HUNDRED_FIXED8,
  FOUR_HUNDRED_FIXED8,
  FIVE_HUNDRED_FIXED8,
  ONE_THOUSAND_FIXED8,
  FIVE_THOUSAND_FIXED8,
  TEN_THOUSAND_FIXED8,
  ONE_HUNDRED_MILLION_FIXED8,
  NEO_ASSET_HASH:
    '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
  GAS_ASSET_HASH:
    '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
  uInt160ToBuffer,
  bufferToUInt160,
  uInt160ToHex,
  hexToUInt160,
  uInt160ToString,
  stringToUInt160,
  uInt160Equal,
  isUInt160,
  asUInt160,
  isUInt256,
  asUInt256,
  isECPoint,
  asECPoint,
  uInt256ToBuffer,
  bufferToUInt256,
  uInt256ToHex,
  hexToUInt256,
  uInt256ToString,
  stringToUInt256,
  uInt256Equal,
  toUInt32LE,
  ecPointToBuffer,
  bufferToECPoint,
  ecPointToHex,
  hexToECPoint,
  ecPointToString,
  ecPointCompare,
  stringToECPoint,
  ecPointEqual,
  ecPointIsInfinity,
  privateKeyToHex,
  hexToPrivateKey,
  privateKeyToBuffer,
  bufferToPrivateKey,
  privateKeyToString,
  stringToPrivateKey,
  fixed8FromDecimal,
  fixed8ToDecimal,
  fixedFromDecimal,
  fixedToDecimal,
};
