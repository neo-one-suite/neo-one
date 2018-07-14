import { BinaryReader, utils } from '@neo-one/client-core';
import { utils as commonUtils } from '@neo-one/utils';
import _ from 'lodash';
import { ArrayStackItem } from './ArrayStackItem';
import { BooleanStackItem } from './BooleanStackItem';
import { BufferStackItem } from './BufferStackItem';
import { UnsupportedStackItemSerdeError } from './errors';
import { IntegerStackItem } from './IntegerStackItem';
import { MapStackItem } from './MapStackItem';
import { StackItem } from './StackItem';
import { assertStackItemType, StackItemType } from './StackItemType';
import { StructStackItem } from './StructStackItem';

const deserializeStackItemBase = (reader: BinaryReader): StackItem => {
  const type = assertStackItemType(reader.readUInt8());
  switch (type) {
    case StackItemType.ByteArray: // BYTE_ARRAY
      return new BufferStackItem(reader.readVarBytesLE());
    case StackItemType.Boolean: // BOOLEAN
      return new BooleanStackItem(reader.readBoolean());
    case StackItemType.Integer: // INTEGER
      return new IntegerStackItem(utils.fromSignedBuffer(reader.readVarBytesLE()));
    case StackItemType.InteropInterface: // INTEROP_INTERFACE
      throw new UnsupportedStackItemSerdeError();
    case StackItemType.Array: // ARRAY
    case StackItemType.Struct: {
      // STRUCT
      const count = reader.readVarUIntLE().toNumber();
      const value = _.range(count).map(() => deserializeStackItemBase(reader));

      return type === 0x80 ? new ArrayStackItem(value) : new StructStackItem(value);
    }
    case StackItemType.Map: {
      // MAP
      const count = reader.readVarUIntLE().toNumber();
      const mutableKeys: { [key: string]: StackItem } = {};
      const mutableValues: { [key: string]: StackItem } = {};
      _.range(count).forEach(() => {
        const key = deserializeStackItemBase(reader);
        const value = deserializeStackItemBase(reader);
        const keyString = key.toKeyString();
        mutableKeys[keyString] = key;
        mutableValues[keyString] = value;
      });

      return new MapStackItem({ keys: mutableKeys, values: mutableValues });
    }
    default:
      commonUtils.assertNever(type);
      throw new Error('For TS');
  }
};

export const deserializeStackItem = (value: Buffer): StackItem => deserializeStackItemBase(new BinaryReader(value));
