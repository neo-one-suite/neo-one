import {
  addressToScriptHash,
  Attribute,
  AttributeModel,
  AttributeUsageModel,
  BufferAttributeModel,
  common,
  ECPointAttributeModel,
  toAttributeUsage,
  UInt160AttributeModel,
  UInt256AttributeModel,
} from '@neo-one/client-common';

// tslint:disable-next-line cyclomatic-complexity
export const attribute = (attrib: Attribute): AttributeModel => {
  const usage = toAttributeUsage(attrib.usage);
  switch (usage) {
    case AttributeUsageModel.DescriptionUrl:
    case AttributeUsageModel.Description:
    case AttributeUsageModel.Remark:
    case AttributeUsageModel.Remark1:
    case AttributeUsageModel.Remark2:
    case AttributeUsageModel.Remark3:
    case AttributeUsageModel.Remark4:
    case AttributeUsageModel.Remark5:
    case AttributeUsageModel.Remark6:
    case AttributeUsageModel.Remark7:
    case AttributeUsageModel.Remark8:
    case AttributeUsageModel.Remark9:
    case AttributeUsageModel.Remark10:
    case AttributeUsageModel.Remark11:
    case AttributeUsageModel.Remark12:
    case AttributeUsageModel.Remark13:
    case AttributeUsageModel.Remark14:
    case AttributeUsageModel.Remark15:
      return new BufferAttributeModel({
        usage,
        value: Buffer.from(attrib.data, 'hex'),
      });
    case AttributeUsageModel.ECDH02:
    case AttributeUsageModel.ECDH03:
      return new ECPointAttributeModel({
        usage,
        value: common.stringToECPoint(attrib.data),
      });
    case AttributeUsageModel.Script:
      return new UInt160AttributeModel({
        usage,
        value: common.stringToUInt160(addressToScriptHash(attrib.data)),
      });
    default:
      return new UInt256AttributeModel({
        usage,
        value: common.stringToUInt256(attrib.data),
      });
  }
};
