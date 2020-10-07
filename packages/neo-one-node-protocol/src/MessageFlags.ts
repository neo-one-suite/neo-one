import { InvalidFormatError } from '@neo-one/client-common';

export enum MessageFlags {
  None = 0,
  Compressed = 1,
}

export const isMessageFlags = (value: number): value is MessageFlags => value === 0x01 || value === 0x00;

export const assertMessageFlags = (value: number): MessageFlags => {
  if (isMessageFlags(value)) {
    return value;
  }

  throw new InvalidFormatError(`expected flag to be 0x00 or 0x01, found: ${value}`);
};
