import {
  AttributeBaseModel,
  AttributeJSON,
  AttributeTypeModel,
  InvalidFormatError,
  IOHelper,
  toJSONAttributeType,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON } from '../../Serializable';
import { VerifyOptions } from '../../Verifiable';
import { Transaction } from '../Transaction';

export const createDeserializeAttributeType = (type: AttributeTypeModel) => (options: DeserializeWireBaseOptions) => {
  const { reader } = options;
  const byte = reader.readUInt8();
  if (byte !== type) {
    throw new InvalidFormatError(`Expected attribute type: ${type}, found: ${byte}`);
  }

  return type;
};

export abstract class AttributeBase extends AttributeBaseModel implements SerializableJSON<AttributeJSON> {
  public serializeJSON(): AttributeJSON {
    return {
      type: toJSONAttributeType(this.type),
    };
  }

  // Must not be implemented in C# land yet?
  public async verify(_verifyOptions: VerifyOptions, _tx: Transaction) {
    return Promise.resolve(true);
  }
}
