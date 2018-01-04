/* @flow */
import {
  InvalidAttributeUsageError,
  assertAttributeUsage,
} from './AttributeUsage';
import {
  type DeserializeWire,
  type DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../../Serializable';

import BufferAttribute from './BufferAttribute';
import ECPointAttribute from './ECPointAttribute';
import UInt160Attribute from './UInt160Attribute';
import UInt256Attribute from './UInt256Attribute';

export type Attribute =
  | BufferAttribute
  | ECPointAttribute
  | UInt160Attribute
  | UInt256Attribute;

export const deserializeWireBase = (
  options: DeserializeWireBaseOptions,
): Attribute => {
  const { reader } = options;
  const usage = assertAttributeUsage(reader.clone().readUInt8());
  switch (usage) {
    case 0x20:
      return UInt160Attribute.deserializeWireBase(options);
    case 0x00:
    case 0x30:
    case 0xa1:
    case 0xa2:
    case 0xa3:
    case 0xa4:
    case 0xa5:
    case 0xa6:
    case 0xa7:
    case 0xa8:
    case 0xa9:
    case 0xaa:
    case 0xab:
    case 0xac:
    case 0xad:
    case 0xae:
    case 0xaf:
      return UInt256Attribute.deserializeWireBase(options);
    case 0x02:
    case 0x03:
      return ECPointAttribute.deserializeWireBase(options);
    case 0x81:
    case 0x90:
    case 0xf0:
    case 0xf1:
    case 0xf2:
    case 0xf3:
    case 0xf4:
    case 0xf5:
    case 0xf6:
    case 0xf7:
    case 0xf8:
    case 0xf9:
    case 0xfa:
    case 0xfb:
    case 0xfc:
    case 0xfd:
    case 0xfe:
    case 0xff:
      return BufferAttribute.deserializeWireBase(options);
    default:
      // eslint-disable-next-line
      (usage: empty);
      throw new InvalidAttributeUsageError(usage);
  }
};

export const deserializeWire: DeserializeWire<
  Attribute,
> = createDeserializeWire(deserializeWireBase);
