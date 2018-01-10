/* @flow */
import { CustomError } from '@neo-one/utils';

import type Block from './Block';
import type { ConsensusPayload } from './payload';
import type { Transaction } from './transaction';

export const SCRIPT_CONTAINER_TYPE = {
  TRANSACTION: 0x00,
  BLOCK: 0x01,
  CONSENSUS: 0x02,
};

export type ScriptContainer =
  | {| type: 0x00, value: Transaction |}
  | {| type: 0x01, value: Block |}
  | {| type: 0x02, value: ConsensusPayload |};
export type ScriptContainerType = 0x00 | 0x01 | 0x02;

export class InvalidScriptContainerTypeError extends CustomError {
  value: number;
  code: string;

  constructor(value: number) {
    super(`Expected script container type, found: ${value.toString(16)}`);
    this.value = value;
    this.code = 'INVALID_SCRIPT_CONTAINER_TYPE';
  }
}

export const assertScriptContainerType = (
  value: number,
): ScriptContainerType => {
  switch (value) {
    case 0x00:
      return SCRIPT_CONTAINER_TYPE.TRANSACTION;
    case 0x01:
      return SCRIPT_CONTAINER_TYPE.BLOCK;
    case 0x02:
      return SCRIPT_CONTAINER_TYPE.CONSENSUS;
    default:
      throw new InvalidScriptContainerTypeError(value);
  }
};
