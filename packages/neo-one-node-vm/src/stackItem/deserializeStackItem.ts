import { BinaryReader, utils } from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
import _ from 'lodash';
import { MAX_ARRAY_SIZE_BN } from '../constants';
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
      const count = reader.readVarUIntLE(MAX_ARRAY_SIZE_BN).toNumber();
      const value = _.range(count).map(() => deserializeStackItemBase(reader));

      return type === 0x80 ? new ArrayStackItem(value) : new StructStackItem(value);
    }
    case StackItemType.Map: {
      // MAP
      const count = reader.readVarUIntLE(MAX_ARRAY_SIZE_BN).toNumber();
      const referenceKeys = new Map<string, StackItem>();
      const referenceValues = new Map<string, StackItem>();
      _.range(count).forEach(() => {
        const key = deserializeStackItemBase(reader);
        const value = deserializeStackItemBase(reader);
        const referenceKey = key.toStructuralKey();
        referenceKeys.set(referenceKey, key);
        referenceValues.set(referenceKey, value);
      });

      return new MapStackItem({ referenceKeys, referenceValues });
    }
    default:
      commonUtils.assertNever(type);
      throw new Error('For TS');
  }
};

export const deserializeStackItem = (value: Buffer): StackItem => deserializeStackItemBase(new BinaryReader(value));
