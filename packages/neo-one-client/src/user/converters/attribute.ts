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
import { InvalidNamedArgumentError } from '../../errors';
import { Attribute as ClientAttribute } from '../../types';

export const attribute = (attributeLike: ClientAttribute): Attribute => {
  if (typeof attributeLike !== 'object') {
    throw new InvalidNamedArgumentError('attribute', attributeLike);
  }

  let usage;
  try {
    usage = toAttributeUsage(attributeLike.usage);
  } catch (error) {
    throw new InvalidNamedArgumentError('attribute', attributeLike);
  }

  if (
    usage === AttributeUsage.DescriptionUrl ||
    usage === AttributeUsage.Description ||
    usage === AttributeUsage.Remark ||
    usage === AttributeUsage.Remark1 ||
    usage === AttributeUsage.Remark2 ||
    usage === AttributeUsage.Remark3 ||
    usage === AttributeUsage.Remark4 ||
    usage === AttributeUsage.Remark5 ||
    usage === AttributeUsage.Remark6 ||
    usage === AttributeUsage.Remark7 ||
    usage === AttributeUsage.Remark8 ||
    usage === AttributeUsage.Remark9 ||
    usage === AttributeUsage.Remark10 ||
    usage === AttributeUsage.Remark11 ||
    usage === AttributeUsage.Remark12 ||
    usage === AttributeUsage.Remark13 ||
    usage === AttributeUsage.Remark14 ||
    usage === AttributeUsage.Remark15
  ) {
    return new BufferAttribute({
      usage,
      value: Buffer.from(attributeLike.data, 'hex'),
    });
  } else if (
    usage === AttributeUsage.ECDH02 ||
    usage === AttributeUsage.ECDH03
  ) {
    return new ECPointAttribute({
      usage,
      value: common.stringToECPoint(attributeLike.data),
    });
  } else if (usage === AttributeUsage.Script) {
    return new UInt160Attribute({
      usage,
      value: common.stringToUInt160(attributeLike.data),
    });
  } else {
    return new UInt256Attribute({
      usage,
      value: common.stringToUInt256(attributeLike.data),
    });
  }
};
