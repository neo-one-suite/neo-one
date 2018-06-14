import { utils } from '@neo-one/utils';
import { createDeserializeWire, DeserializeWireBaseOptions } from '../../Serializable';
import { assertAttributeUsage, AttributeUsage } from './AttributeUsage';
import { BufferAttribute } from './BufferAttribute';
import { ECPointAttribute } from './ECPointAttribute';
import { UInt160Attribute } from './UInt160Attribute';
import { UInt256Attribute } from './UInt256Attribute';

export type Attribute = BufferAttribute | ECPointAttribute | UInt160Attribute | UInt256Attribute;

export const deserializeAttributeWireBase = (options: DeserializeWireBaseOptions): Attribute => {
  const { reader } = options;
  const usage = assertAttributeUsage(reader.clone().readUInt8());
  switch (usage) {
    case AttributeUsage.Script:
      return UInt160Attribute.deserializeWireBase(options);
    case AttributeUsage.ContractHash:
    case AttributeUsage.Vote:
    case AttributeUsage.Hash1:
    case AttributeUsage.Hash2:
    case AttributeUsage.Hash3:
    case AttributeUsage.Hash4:
    case AttributeUsage.Hash5:
    case AttributeUsage.Hash6:
    case AttributeUsage.Hash7:
    case AttributeUsage.Hash8:
    case AttributeUsage.Hash9:
    case AttributeUsage.Hash10:
    case AttributeUsage.Hash11:
    case AttributeUsage.Hash12:
    case AttributeUsage.Hash13:
    case AttributeUsage.Hash14:
    case AttributeUsage.Hash15:
      return UInt256Attribute.deserializeWireBase(options);
    case AttributeUsage.ECDH02:
    case AttributeUsage.ECDH03:
      return ECPointAttribute.deserializeWireBase(options);
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
      return BufferAttribute.deserializeWireBase(options);
    default:
      utils.assertNever(usage);
      throw new Error('For TS');
  }
};

export const deserializeAttributeWire = createDeserializeWire(deserializeAttributeWireBase);
