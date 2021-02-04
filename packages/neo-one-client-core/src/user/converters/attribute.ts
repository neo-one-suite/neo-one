import {
  Attribute,
  AttributeModel,
  AttributeTypeModel,
  HighPriorityAttributeModel,
  OracleResponseModel,
} from '@neo-one/client-common';
import { BN } from 'bn.js';

export const attribute = (attrib: Attribute): AttributeModel => {
  switch (attrib.type) {
    case AttributeTypeModel.HighPriority:
      return new HighPriorityAttributeModel();
    case AttributeTypeModel.OracleResponse:
      return new OracleResponseModel({
        id: new BN(attrib.id.toString()),
        code: attrib.code,
        result: Buffer.from(attrib.result, 'hex'),
      });
    default:
      throw new Error('for ts');
  }
};
