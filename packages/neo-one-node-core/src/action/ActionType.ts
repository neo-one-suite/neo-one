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
