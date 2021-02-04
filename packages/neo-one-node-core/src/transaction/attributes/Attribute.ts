import { assertAttributeType, AttributeTypeModel, InvalidFormatError } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../../Serializable';
import { HighPriorityAttribute } from './HighPriorityAttribute';
import { OracleResponse } from './OracleResponse';

export type Attribute = HighPriorityAttribute | OracleResponse;

export const deserializeAttribute = (options: DeserializeWireBaseOptions): Attribute => {
  const { reader } = options;
  const typeIn = reader.readUInt8();
  const type = assertAttributeType(typeIn);

  switch (type) {
    case AttributeTypeModel.HighPriority:
      return HighPriorityAttribute.deserializeWithoutType(reader);
    case AttributeTypeModel.OracleResponse:
      return OracleResponse.deserializeWithoutType(reader);
    default:
      throw new InvalidFormatError(`Attribute type ${type} not yet implemented`);
  }
};

export const getIsAttribute = <T extends Attribute>(type: AttributeTypeModel) => (attr: Attribute): attr is T =>
  attr.type === type;

export const isHighPriorityAttribute = getIsAttribute<HighPriorityAttribute>(AttributeTypeModel.HighPriority);
export const isOracleResponse = getIsAttribute<OracleResponse>(AttributeTypeModel.OracleResponse);
