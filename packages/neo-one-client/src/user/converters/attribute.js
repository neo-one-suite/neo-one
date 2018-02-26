/* @flow */
import {
  type Attribute,
  BufferAttribute,
  ECPointAttribute,
  UInt160Attribute,
  UInt256Attribute,
  common,
  toAttributeUsage,
} from '@neo-one/client-core';

import { InvalidNamedArgumentError } from '../../errors';
import type { Attribute as ClientAttribute } from '../../types';

export default (attributeLike: ClientAttribute): Attribute => {
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
    usage === 0x81 ||
    usage === 0x90 ||
    usage === 0xf0 ||
    usage === 0xf1 ||
    usage === 0xf2 ||
    usage === 0xf3 ||
    usage === 0xf4 ||
    usage === 0xf5 ||
    usage === 0xf6 ||
    usage === 0xf7 ||
    usage === 0xf8 ||
    usage === 0xf9 ||
    usage === 0xfa ||
    usage === 0xfb ||
    usage === 0xfc ||
    usage === 0xfd ||
    usage === 0xfe ||
    usage === 0xff
  ) {
    return new BufferAttribute({
      usage,
      value: Buffer.from(attributeLike.data, 'hex'),
    });
  } else if (usage === 0x02 || usage === 0x03) {
    return new ECPointAttribute({
      usage,
      value: common.stringToECPoint(attributeLike.data),
    });
  } else if (usage === 0x20) {
    return new UInt160Attribute({
      usage,
      value: common.stringToUInt160(attributeLike.data),
    });
  } else if (
    usage === 0x00 ||
    usage === 0x30 ||
    usage === 0xa1 ||
    usage === 0xa2 ||
    usage === 0xa3 ||
    usage === 0xa4 ||
    usage === 0xa5 ||
    usage === 0xa6 ||
    usage === 0xa7 ||
    usage === 0xa8 ||
    usage === 0xa9 ||
    usage === 0xaa ||
    usage === 0xab ||
    usage === 0xac ||
    usage === 0xad ||
    usage === 0xae ||
    usage === 0xaf
  ) {
    return new UInt256Attribute({
      usage,
      value: common.stringToUInt256(attributeLike.data),
    });
  }

  /* istanbul ignore next */
  throw new InvalidNamedArgumentError('attribute', attributeLike);
};
