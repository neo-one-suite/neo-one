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
      readonly type: ScriptContainerType.Transaction;
      readonly value: Transaction;
    }
  | {
      readonly type: ScriptContainerType.Block;
      readonly value: Block;
    }
  | {
      readonly type: ScriptContainerType.Consensus;
      readonly value: ConsensusPayload;
    };

export class InvalidScriptContainerTypeError extends CustomError {
  public readonly value: number;
  public readonly code: string;

  public constructor(value: number) {
    super(`Expected script container type, found: ${value.toString(16)}`);
    this.value = value;
    this.code = 'INVALID_SCRIPT_CONTAINER_TYPE';
  }
}

const isScriptContainerType = (value: number): value is ScriptContainerType =>
  // tslint:disable-next-line strict-type-predicates
  ScriptContainerType[value] !== undefined;

export const assertScriptContainerType = (value: number): ScriptContainerType => {
  if (isScriptContainerType(value)) {
    return value;
  }

  throw new InvalidScriptContainerTypeError(value);
};
