import { InvalidOracleResponseCodeError } from '../../../errors';

export enum OracleResponseCode {
  Success = 0x00,

  ProtocolNotSupported = 0x10,
  ConsensusUnreachable = 0x12,
  NotFound = 0x14,
  Timeout = 0x16,
  Forbidden = 0x18,
  ResponseTooLarge = 0x1a,
  InsufficientFunds = 0x1c,
  ContentTypeNotSupported = 0x1f,

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
