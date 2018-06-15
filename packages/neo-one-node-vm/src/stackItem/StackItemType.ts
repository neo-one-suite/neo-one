import { CustomError } from '@neo-one/utils';

export enum StackItemType {
  ByteArray = 0x00,
  Boolean = 0x01,
  Integer = 0x02,
  InteropInterface = 0x40,
  Array = 0x80,
  Struct = 0x81,
  Map = 0x82,
}

export class InvalidStackItemTypeError extends CustomError {
  public readonly stackItemType: number;
  public readonly code: string;

  public constructor(stackItemType: number) {
    super(`Expected stack item type, found: ${stackItemType.toString(16)}`);
    this.stackItemType = stackItemType;
    this.code = 'INVALID_STACK_ITEM_TYPE';
  }
}

const isStackItemType = (value: number): value is StackItemType =>
  // tslint:disable-next-line strict-type-predicates
  StackItemType[value] !== undefined;

export const assertStackItemType = (value: number): StackItemType => {
  if (isStackItemType(value)) {
    return value;
  }

  throw new InvalidStackItemTypeError(value);
};
