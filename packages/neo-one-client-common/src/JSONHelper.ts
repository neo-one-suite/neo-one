import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { common, ECPoint, ECPointHex, UInt160, UInt160Hex, UInt256, UInt256Hex } from './common';

// tslint:disable-next-line variable-name
export const JSONHelper = {
  writeUInt64LE: (value: BN): string => value.toString(16, 16),
  readUInt64LE: (value: string): BN => new BN(value, 16),
  writeUInt64: (value: BN): string => value.toString(10),
  readUInt64: (value: string): BigNumber => new BigNumber(value),
  writeUInt160: (value: UInt160 | UInt160Hex): string => common.uInt160ToString(value),
  readUInt160: (hash: string): UInt160 => common.stringToUInt160(hash),
  writeUInt256: (value: UInt256 | UInt256Hex): string => common.uInt256ToString(value),
  readUInt256: (hash: string): UInt256 => common.stringToUInt256(hash),
  writeFixed8: (value: BN): string => common.fixed8ToDecimal(value).toString(),
  readFixed8: (value: string): BN => common.fixed8FromDecimal(new BigNumber(value)),
  writeECPoint: (value: ECPoint | ECPointHex): string => common.ecPointToString(value),
  readECPoint: (value: string): ECPoint => common.stringToECPoint(value),
  writeBuffer: (value: Buffer): string => value.toString('hex'),
  readBuffer: (value: string): Buffer => Buffer.from(value, 'hex'),
};
