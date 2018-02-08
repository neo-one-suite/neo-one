/* @flow */
import { CustomError } from '@neo-one/utils';

export const STACK_ITEM_TYPE = {
  BYTE_ARRAY: 0x00,
  BOOLEAN: 0x01,
  INTEGER: 0x02,
  INTEROP_INTERFACE: 0x40,
  ARRAY: 0x80,
  STRUCT: 0x81,
};

export class InvalidStackItemTypeError extends CustomError {
  stackItemType: number;
  code: string;

  constructor(stackItemType: number) {
    super(`Expected stack item type, found: ${stackItemType.toString(16)}`);
    this.stackItemType = stackItemType;
    this.code = 'INVALID_STACK_ITEM_TYPE';
  }
}

export type StackItemType = 0x00 | 0x01 | 0x02 | 0x40 | 0x80 | 0x81;

export const assertStackItemType = (value: number): StackItemType => {
  switch (value) {
    case 0x00: // BYTE_ARRAY
      return 0x00;
    case 0x01: // BOOLEAN
      return 0x01;
    case 0x02: // INTEGER
      return 0x02;
    case 0x40: // INTEROP_INTERFACE
      return 0x40;
    case 0x80: // ARRAY
      return 0x80;
    case 0x81: // STRUCT
      return 0x81;
    default:
      throw new InvalidStackItemTypeError(value);
  }
};
