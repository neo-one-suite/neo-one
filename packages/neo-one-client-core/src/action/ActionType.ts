import { CustomError } from '@neo-one/utils';

export enum ActionType {
  Log = 0x00,
  Notification = 0x01,
}

export class InvalidActionTypeError extends CustomError {
  public readonly type: number;
  public readonly code: string;

  public constructor(type: number) {
    super(`Expected action type, found: ${type}`);
    this.type = type;
    this.code = 'INVALID_ACTION_TYPE';
  }
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
