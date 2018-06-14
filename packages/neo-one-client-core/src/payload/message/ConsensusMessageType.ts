import { CustomError } from '@neo-one/utils';

export enum ConsensusMessageType {
  ChangeView = 0x00,
  PrepareRequest = 0x20,
  PrepareResponse = 0x21,
}

// PrepareResponse

export class InvalidConsensusMessageTypeError extends CustomError {
  public readonly type: number;
  public readonly code: string;

  public constructor(type: number) {
    super(`Expected action type, found: ${type}`);
    this.type = type;
    this.code = 'INVALID_ACTION_TYPE';
  }
}

const isConsensusMessageType = (value: number): value is ConsensusMessageType =>
  // tslint:disable-next-line strict-type-predicates
  ConsensusMessageType[value] !== undefined;

export const assertConsensusMessageType = (value: number): ConsensusMessageType => {
  if (isConsensusMessageType(value)) {
    return value;
  }
  throw new InvalidConsensusMessageTypeError(value);
};
