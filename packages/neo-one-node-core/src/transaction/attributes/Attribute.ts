import { assertAttributeType, AttributeTypeModel, InvalidFormatError } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { HighPriorityAttribute } from './HighPriorityAttribute';

export type Attribute = HighPriorityAttribute;

export const deserializeAttribute = (options: DeserializeWireBaseOptions): Attribute => {
  const { reader } = options;
  const typeIn = reader.readUInt8();
  const type = assertAttributeType(typeIn);

  switch (type) {
    case AttributeTypeModel.HighPriority:
      return new HighPriorityAttribute();
    default:
      throw new InvalidFormatError(`Attribute type ${type} not yet implemented`);
  }
};
