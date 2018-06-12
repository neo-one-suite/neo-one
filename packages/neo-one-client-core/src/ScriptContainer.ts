import { CustomError } from '@neo-one/utils';
import { Block } from './Block';
import { ConsensusPayload } from './payload';
import { Transaction } from './transaction';

export enum ScriptContainerType {
  Transaction = 0x00,
  Block = 0x01,
  Consensus = 0x02,
}

export type ScriptContainer =
  | {
      type: ScriptContainerType.Transaction;
      value: Transaction;
    }
  | {
      type: ScriptContainerType.Block;
      value: Block;
    }
  | {
      type: ScriptContainerType.Consensus;
      value: ConsensusPayload;
    };

export class InvalidScriptContainerTypeError extends CustomError {
  public readonly value: number;
  public readonly code: string;

  constructor(value: number) {
    super(`Expected script container type, found: ${value.toString(16)}`);
    this.value = value;
    this.code = 'INVALID_SCRIPT_CONTAINER_TYPE';
  }
}

const isScriptContainerType = (value: number): value is ScriptContainerType =>
  ScriptContainerType[value] != null;

export const assertScriptContainerType = (
  value: number,
): ScriptContainerType => {
  if (isScriptContainerType(value)) {
    return value;
  }

  throw new InvalidScriptContainerTypeError(value);
};
