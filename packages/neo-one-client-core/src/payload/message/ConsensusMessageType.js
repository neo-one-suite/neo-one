/* @flow */
import { CustomError } from '@neo-one/utils';

export const CONSENSUS_MESSAGE_TYPE = {
  CHANGE_VIEW: 0x00,
  PREPARE_REQUEST: 0x20,
  PREPARE_RESPONSE: 0x21,
};
export type ConsensusMessageType =
  | 0x00 // ChangeView
  | 0x20 // PrepareRequest
  | 0x21; // PrepareResponse

export class InvalidConsensusMessageTypeError extends CustomError {
  type: number;
  code: string;

  constructor(type: number) {
    super(`Expected action type, found: ${type}`);
    this.type = type;
    this.code = 'INVALID_ACTION_TYPE';
  }
}

export const assertConsensusMessageType = (
  value: number,
): ConsensusMessageType => {
  switch (value) {
    case CONSENSUS_MESSAGE_TYPE.CHANGE_VIEW:
      return CONSENSUS_MESSAGE_TYPE.CHANGE_VIEW;
    case CONSENSUS_MESSAGE_TYPE.PREPARE_REQUEST:
      return CONSENSUS_MESSAGE_TYPE.PREPARE_REQUEST;
    case CONSENSUS_MESSAGE_TYPE.PREPARE_RESPONSE:
      return CONSENSUS_MESSAGE_TYPE.PREPARE_RESPONSE;
    default:
      throw new InvalidConsensusMessageTypeError(value);
  }
};
