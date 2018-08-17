import {
  Attribute,
  AttributeUsage,
  BufferAttribute,
  common,
  ECPointAttribute,
  toAttributeUsage,
  UInt160Attribute,
  UInt256Attribute,
} from '@neo-one/client-core';
import { addressToScriptHash } from '../../helpers';
import { Attribute as ClientAttribute } from '../../types';

// tslint:disable-next-line cyclomatic-complexity
export const attribute = (attrib: ClientAttribute): Attribute => {
  const usage = toAttributeUsage(attrib.usage);
  switch (usage) {
    case AttributeUsage.DescriptionUrl:
    case AttributeUsage.Description:
    case AttributeUsage.Remark:
    case AttributeUsage.Remark1:
    case AttributeUsage.Remark2:
    case AttributeUsage.Remark3:
    case AttributeUsage.Remark4:
    case AttributeUsage.Remark5:
    case AttributeUsage.Remark6:
    case AttributeUsage.Remark7:
    case AttributeUsage.Remark8:
    case AttributeUsage.Remark9:
    case AttributeUsage.Remark10:
    case AttributeUsage.Remark11:
    case AttributeUsage.Remark12:
    case AttributeUsage.Remark13:
    case AttributeUsage.Remark14:
    case AttributeUsage.Remark15:
      return new BufferAttribute({
        usage,
        value: Buffer.from(attrib.data, 'hex'),
      });
    case AttributeUsage.ECDH02:
    case AttributeUsage.ECDH03:
      return new ECPointAttribute({
        usage,
        value: common.stringToECPoint(attrib.data),
      });
    case AttributeUsage.Script:
      return new UInt160Attribute({
        usage,
        value: common.stringToUInt160(addressToScriptHash(attrib.data)),
      });
    default:
      return new UInt256Attribute({
        usage,
        value: common.stringToUInt256(attrib.data),
      });
  }
};
