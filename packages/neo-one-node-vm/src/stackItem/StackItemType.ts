import { makeErrorWithCode } from '@neo-one/utils';

export enum StackItemType {
  ByteArray = 0x00,
  Boolean = 0x01,
  Integer = 0x02,
  InteropInterface = 0x40,
  Array = 0x80,
  Struct = 0x81,
  Map = 0x82,
}

export const InvalidStackItemTypeError = makeErrorWithCode(
  'INVALID_STACK_ITEM_TYPE',
  (stackItemType: number) => `Expected stack item type, found: ${stackItemType.toString(16)}`,
);

const isStackItemType = (value: number): value is StackItemType =>
  // tslint:disable-next-line strict-type-predicates
  StackItemType[value] !== undefined;

export const assertStackItemType = (value: number): StackItemType => {
  if (isStackItemType(value)) {
    return value;
  }

  throw new InvalidStackItemTypeError(value);
};
