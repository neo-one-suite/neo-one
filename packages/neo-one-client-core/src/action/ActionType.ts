import { makeErrorWithCode } from '@neo-one/utils';

export enum ActionType {
  Log = 0x00,
  Notification = 0x01,
}

export const InvalidActionTypeError = makeErrorWithCode(
  'INVALID_ACTION_TYPE',
  (type: number) => `Expected action type, found: ${type}`,
);

const isActionType = (value: number): value is ActionType =>
  // tslint:disable-next-line strict-type-predicates
  ActionType[value] !== undefined;

export const assertActionType = (value: number): ActionType => {
  if (isActionType(value)) {
    return value;
  }

  throw new InvalidActionTypeError(value);
};
