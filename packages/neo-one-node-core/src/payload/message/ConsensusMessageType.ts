import { InvalidConsensusMessageTypeError } from '../../errors';

export enum ConsensusMessageType {
  ChangeView = 0x00,
  PrepareRequest = 0x20,
  PrepareResponse = 0x21,
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
