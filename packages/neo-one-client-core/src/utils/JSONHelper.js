/* @flow */
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

import common, {
  type ECPoint,
  type ECPointHex,
  type UInt160,
  type UInt160Hex,
  type UInt256,
  type UInt256Hex,
} from '../common';

export default {
  writeUInt64LE: (value: BN) => value.toString(16, 16),
  readUInt64LE: (value: string) => new BN(value, 16),
  writeUInt160: (value: UInt160 | UInt160Hex): string =>
    common.uInt160ToString(value),
  readUInt160: (hash: string): UInt160 => common.stringToUInt160(hash),
  writeUInt256: (value: UInt256 | UInt256Hex): string =>
    common.uInt256ToString(value),
  readUInt256: (hash: string): UInt256 => common.stringToUInt256(hash),
  writeFixed8: (value: BN): string => common.fixed8ToDecimal(value).toString(),
  readFixed8: (value: string): BN =>
    common.fixed8FromDecimal(new BigNumber(value)),
  writeECPoint: (value: ECPoint | ECPointHex): string =>
    common.ecPointToString(value),
  readECPoint: (value: string): ECPoint => common.stringToECPoint(value),
  writeBuffer: (value: Buffer): string => value.toString('hex'),
  readBuffer: (value: string): Buffer => Buffer.from(value, 'hex'),
};
