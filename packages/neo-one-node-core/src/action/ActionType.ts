import { InvalidFormatError } from '@neo-one/client-common';
import { InvalidActionTypeError } from '../errors';

export enum ActionType {
  Log = 0x00,
  Notification = 0x01,
}

const isActionType = (value: number): value is ActionType =>
  // tslint:disable-next-line strict-type-predicates
  ActionType[value] !== undefined;

export const assertActionType = (value: number): ActionType => {
  if (isActionType(value)) {
    return value;
  }

  throw new InvalidActionTypeError(value);
};

export enum ActionSource {
  Block = 0x00,
  Transaction = 0x01,
}

type ActionSourceJSON = keyof typeof ActionSource;

// tslint:disable-next-line: strict-type-predicates no-any
const isActionSourceJSON = (source: string): source is ActionSourceJSON => ActionSource[source as any] !== undefined;

const assertActionSourceJSON = (source: string): ActionSourceJSON => {
  if (isActionSourceJSON(source)) {
    return source;
  }

  throw new InvalidFormatError();
};

export const actionSourceToJSON = (source: ActionSource) => assertActionSourceJSON(ActionSource[source]);
