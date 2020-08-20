import {
  AttributeBaseModel,
  AttributeJSON,
  AttributeTypeModel,
  InvalidFormatError,
  IOHelper,
  toJSONAttributeType,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from '../../Serializable';

export const createDeserializeAttributeType = (type: AttributeTypeModel) => (options: DeserializeWireBaseOptions) => {
  const { reader } = options;
  const byte = reader.readUInt8();
  if (byte !== type) {
    throw new InvalidFormatError(`Expected attribute type: ${type}, found: ${byte}`);
  }

  return type;
};

export abstract class AttributeBase extends AttributeBaseModel implements SerializableJSON<AttributeJSON> {
  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      type: toJSONAttributeType(this.type),
    };
  }

  public get size() {
    return IOHelper.sizeOfUInt8 + this.sizeExclusive();
  }

  protected sizeExclusive(): number {
    return 0;
  }
}
