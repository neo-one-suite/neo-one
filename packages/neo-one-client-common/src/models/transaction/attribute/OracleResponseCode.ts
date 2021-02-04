import { InvalidOracleResponseCodeError } from '../../../errors';

export enum OracleResponseCode {
  Success = 0x00,

  ConsensusUnreachable = 0x10,
  NotFound = 0x12,
  Timeout = 0x14,
  Forbidden = 0x16,
  ResponseTooLarge = 0x18,
  InsufficientFunds = 0x1a,

  Error = 0xff,
}

const isOracleResponseCode = (value: number): value is OracleResponseCode =>
  // tslint:disable-next-line: strict-type-predicates
  OracleResponseCode[value] !== undefined;

export const assertOracleResponseCode = (value: number): OracleResponseCode => {
  if (isOracleResponseCode(value)) {
    return value;
  }

  throw new InvalidOracleResponseCodeError(value);
};
