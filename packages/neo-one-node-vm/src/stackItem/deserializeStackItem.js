/* @flow */
import { BinaryReader, utils } from '@neo-one/client-core';

import ArrayStackItem from './ArrayStackItem';
import BooleanStackItem from './BooleanStackItem';
import BufferStackItem from './BufferStackItem';
import IntegerStackItem from './IntegerStackItem';
import type { StackItem } from './StackItem';
import StructStackItem from './StructStackItem';
import { UnsupportedStackItemSerdeError } from './errors';

import { assertStackItemType } from './StackItemType';

const deserializeStackItemBase = (reader: BinaryReader): StackItem => {
  const type = assertStackItemType(reader.readUInt8());
  switch (type) {
    case 0x00: // BYTE_ARRAY
      return new BufferStackItem(reader.readVarBytesLE());
    case 0x01: // BOOLEAN
      return new BooleanStackItem(reader.readBoolean());
    case 0x02: // INTEGER
      return new IntegerStackItem(
        utils.fromSignedBuffer(reader.readVarBytesLE()),
      );
    case 0x40: // INTEROP_INTERFACE
      throw new UnsupportedStackItemSerdeError();
    case 0x80: // ARRAY
    case 0x81: {
      // STRUCT
      const count = reader.readVarUIntLE().toNumber();
      const value = [];
      for (let i = 0; i < count; i += 1) {
        value.push(deserializeStackItemBase(reader));
      }
      return type === 0x80
        ? new ArrayStackItem(value)
        : new StructStackItem(value);
    }
    default:
      // eslint-disable-next-line
      (type: empty);
      throw new Error('For Flow');
  }
};

export default (value: Buffer): StackItem =>
  deserializeStackItemBase(new BinaryReader(value));
