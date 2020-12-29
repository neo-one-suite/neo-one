import { makeErrorWithCode } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { Wildcard } from './models';

/* istanbul ignore next */
export const InvalidFormatError = makeErrorWithCode(
  'INVALID_FORMAT',
  (reason?: string) => `Invalid format${reason === undefined ? '.' : `: ${reason}`}`,
);

const add0x = (value: string) => (value.startsWith('0x') ? value : `0x${value}`);
const strip0x = (value: string) => (value.startsWith('0x') ? value.substring(2) : value);
const reverse = (src: Buffer): Buffer => {
  const mutableOut = Buffer.allocUnsafe(src.length);
  // tslint:disable-next-line no-loop-statement
  for (let i = 0, j = src.length - 1; i <= j; i += 1, j -= 1) {
    mutableOut[i] = src[j];
    mutableOut[j] = src[i];
  }

  return mutableOut;
};

export type UInt160 = Buffer & { readonly __uint160: undefined };
export type UInt160Hex = string;

const UINT160_BUFFER_BYTES = 20;

const isUInt160 = (value: {}): value is UInt160 => value instanceof Buffer && value.length === UINT160_BUFFER_BYTES;

const asUInt160 = (value: {}): UInt160 => {
  if (isUInt160(value)) {
    return value;
  }

  throw new InvalidFormatError('Invalid UInt160');
};

const bufferToUInt160 = asUInt160;

const uInt160ToHex = (value: UInt160): UInt160Hex => add0x(reverse(value).toString('hex'));

const hexToUInt160 = (value: UInt160Hex | UInt160): UInt160 =>
  typeof value === 'string' ? asUInt160(reverse(Buffer.from(strip0x(value), 'hex'))) : asUInt160(value);

const uInt160ToBuffer = (value: UInt160 | UInt160Hex): Buffer =>
  typeof value === 'string' ? hexToUInt160(value) : value;

const uInt160ToString = (value: UInt160 | UInt160Hex): string =>
  typeof value === 'string' ? value : uInt160ToHex(value);

const stringToUInt160 = hexToUInt160;

const uInt160Equal = (a: UInt160, b: UInt160) => a.equals(b);

const ZERO_UINT160 = Buffer.alloc(20, 0) as UInt160;

export type UInt256 = Buffer & { readonly __uint256: undefined };
export type UInt256Hex = string;

const UINT256_BUFFER_BYTES = 32;
const ZERO_UINT256 = Buffer.alloc(UINT256_BUFFER_BYTES, 0) as UInt256;
const MAX_UINT256 = Buffer.alloc(UINT256_BUFFER_BYTES, 0xff) as UInt256;

const isUInt256 = (value: {}): value is UInt256 => value instanceof Buffer && value.length === UINT256_BUFFER_BYTES;

const asUInt256 = (value: {}): UInt256 => {
  if (isUInt256(value)) {
    return value;
  }

  throw new InvalidFormatError('Invalid UInt256');
};

const bufferToUInt256 = asUInt256;

const uInt256ToHex = (value: UInt256): UInt256Hex => add0x(reverse(value).toString('hex'));

const hexToUInt256 = (value: UInt256Hex | UInt256): UInt256 =>
  typeof value === 'string' ? bufferToUInt256(reverse(Buffer.from(strip0x(value), 'hex'))) : bufferToUInt256(value);

const uInt256ToBuffer = (value: UInt256 | UInt256Hex): Buffer =>
  typeof value === 'string' ? hexToUInt256(value) : value;

const uInt256ToString = (value: UInt256 | UInt256Hex): string =>
  typeof value === 'string' ? value : uInt256ToHex(value);

const stringToUInt256 = hexToUInt256;

const uInt256Equal = (a: UInt256, b: UInt256) => a.equals(b);

const toUInt32LE = (bytes: UInt256): number => new BN(uInt256ToBuffer(bytes).slice(0, 4), 'le').toNumber();

export type ECPointBase = Buffer & { readonly __ecpoint: undefined };
export type ECPointInfinity = Buffer & { readonly __ecpoint: undefined };
export type ECPoint = ECPointBase | ECPointInfinity;
export type ECPointHex = string;

// Encoded compressed ECPoint
const ECPOINT_BUFFER_BYTES = 33;
const ECPOINT_INFINITY_BYTE = 0x00;
const ECPOINT_INFINITY = Buffer.from([ECPOINT_INFINITY_BYTE]) as ECPointInfinity;

const isECPoint = (value: {}): value is ECPoint =>
  value instanceof Buffer && (value.length === ECPOINT_BUFFER_BYTES || value.equals(ECPOINT_INFINITY));

const asECPoint = (value: {}): ECPoint => {
  if (isECPoint(value)) {
    return value;
  }

  throw new InvalidFormatError('Invalid ECPoint');
};

const bufferToECPoint = asECPoint;

const ecPointToHex = (value: ECPoint | ECPointHex): ECPointHex =>
  typeof value === 'string' ? value : value.toString('hex');

const hexToECPoint = (value: ECPoint | ECPointHex): ECPoint =>
  bufferToECPoint(typeof value === 'string' ? Buffer.from(value, 'hex') : value);

const ecPointToBuffer = (value: ECPoint | ECPointHex): Buffer =>
  typeof value === 'string' ? hexToECPoint(value) : value;

const ecPointToString = (value: ECPoint | ECPointHex): string =>
  typeof value === 'string' ? value : ecPointToHex(value);

const stringToECPoint = hexToECPoint;

const ecPointEqual = (a: ECPoint, b: ECPoint): boolean => a.equals(b);

const ecPointCompare = (a: ECPoint | ECPointHex, b: ECPoint | ECPointHex) => {
  const aHex = ecPointToHex(a);
  const bHex = ecPointToHex(b);
  if (aHex < bHex) {
    return -1;
  }

  if (aHex > bHex) {
    return 1;
  }

  return 0;
};

const ecPointIsInfinity = (value: ECPoint): boolean => value.equals(ECPOINT_INFINITY);

export type PrivateKey = Buffer & { readonly __privatekey: undefined };
export type PrivateKeyHex = string;

const PRIVATE_KEY_BUFFER_BYTES = 32;

const isPrivateKey = (value: {}): value is PrivateKey =>
  value instanceof Buffer && value.length === PRIVATE_KEY_BUFFER_BYTES;

const asPrivateKey = (value: {}): PrivateKey => {
  if (isPrivateKey(value)) {
    return value;
  }

  throw new InvalidFormatError(`Invalid Private Key, found: ${value}`);
};

const bufferToPrivateKey = asPrivateKey;

const privateKeyToHex = (value: PrivateKey | PrivateKeyHex): PrivateKeyHex =>
  typeof value === 'string' ? value : value.toString('hex');

const hexToPrivateKey = (value: PrivateKey | PrivateKeyHex): PrivateKey =>
  bufferToPrivateKey(typeof value === 'string' ? Buffer.from(strip0x(value), 'hex') : value);

const privateKeyToBuffer = (value: PrivateKey | PrivateKeyHex): Buffer =>
  typeof value === 'string' ? hexToPrivateKey(value) : value;

const privateKeyToString = (value: PrivateKey | PrivateKeyHex): string =>
  typeof value === 'string' ? value : privateKeyToHex(value);

const stringToPrivateKey = hexToPrivateKey;

const fixedFromDecimal = (value: number | string | BigNumber | BN, decimals: number) => {
  if (value instanceof BN) {
    return value;
  }

  const d = new BN(10 ** decimals);
  if (typeof value === 'number') {
    return new BN(value).mul(d);
  }

  const valueBigNumber = typeof value === 'string' ? new BigNumber(value) : value;
  const dBigNumber = new BigNumber(d.toString(10));

  return new BN(valueBigNumber.times(dBigNumber).toString(), 10);
};

const D8 = new BN(100000000);

const fixed8FromDecimal = (value: number | string | BigNumber | BN): BN => fixedFromDecimal(value, 8);

const fixedToDecimal = (value: BN, decimals: number): BigNumber => {
  const dBigNumber = new BigNumber(10 ** decimals);

  return new BigNumber(value.toString(10)).div(dBigNumber);
};

const fixed8ToDecimal = (bn: BN): BigNumber => fixedToDecimal(bn, 8);

const isWildcard = (input: unknown): input is Wildcard => input === '*';

const NEGATIVE_SATOSHI_FIXED8 = new BN(-1);
const TEN_FIXED8 = fixed8FromDecimal(10);
const TWENTY_FIXED8 = fixed8FromDecimal(20);
const ONE_HUNDRED_FIXED8 = fixed8FromDecimal(100);
const FOUR_HUNDRED_FIXED8 = fixed8FromDecimal(400);
const FIVE_HUNDRED_FIXED8 = fixed8FromDecimal(500);
const ONE_THOUSAND_FIXED8 = fixed8FromDecimal(1000);
const FIVE_THOUSAND_FIXED8 = fixed8FromDecimal(5000);
const TEN_THOUSAND_FIXED8 = fixed8FromDecimal(10000);
const ONE_HUNDRED_MILLION_FIXED8 = fixed8FromDecimal(100000000);

const nativeScriptHashes = {
  GAS: '0x668e0c1f9d7b70a99dd9e06eadd4c784d641afbc',
  NEO: '0xde5f57d430d3dece511cf975a8d37848cb9e0525',
  Policy: '0xce06595079cd69583126dbfd1d2e25cca74cffe9',
};

const nativeHashes = {
  GAS: hexToUInt160(nativeScriptHashes.GAS),
  NEO: hexToUInt160(nativeScriptHashes.NEO),
  Policy: hexToUInt160(nativeScriptHashes.Policy),
};

export const common = {
  D8,
  NEO_ADDRESS_VERSION: 0x35,
  NEO_PRIVATE_KEY_VERSION: 0x80,
  GROUPING_SIZE_BYTES: 16,
  MAX_CONTRACT_STRING: 252,
  MAX_MANIFEST_LENGTH: 4096,
  ECPOINT_BUFFER_BYTES,
  ECPOINT_INFINITY,
  ECPOINT_INFINITY_BYTE,
  PRIVATE_KEY_BUFFER_BYTES,
  UINT160_BUFFER_BYTES,
  UINT256_BUFFER_BYTES,
  ZERO_UINT160,
  ZERO_UINT256,
  MAX_UINT256,
  NEGATIVE_SATOSHI_FIXED8,
  TEN_FIXED8,
  TWENTY_FIXED8,
  ONE_HUNDRED_FIXED8,
  FOUR_HUNDRED_FIXED8,
  FIVE_HUNDRED_FIXED8,
  ONE_THOUSAND_FIXED8,
  FIVE_THOUSAND_FIXED8,
  TEN_THOUSAND_FIXED8,
  ONE_HUNDRED_MILLION_FIXED8,
  uInt160ToBuffer,
  add0x,
  strip0x,
  asUInt160,
  uInt160ToHex,
  hexToUInt160,
  uInt160ToString,
  stringToUInt160,
  uInt160Equal,
  isUInt160,
  bufferToUInt160,
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
  isPrivateKey,
  asPrivateKey,
  fixed8FromDecimal,
  fixed8ToDecimal,
  fixedFromDecimal,
  fixedToDecimal,
  reverse,
  isWildcard,
  nativeScriptHashes,
  nativeHashes,
};
