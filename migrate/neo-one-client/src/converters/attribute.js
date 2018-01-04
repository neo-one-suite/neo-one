/* @flow */
import {
  type Attribute,
  BufferAttribute,
  ECPointAttribute,
  UInt160Attribute,
  UInt256Attribute,
  toAttributeUsage,
} from '@neo-one/client-core';

import type ClientBase from '../ClientBase';
import { InvalidArgumentError } from '../errors';
import type { AttributeLike } from '../types';

import hash160 from './hash160';
import hash256 from './hash256';
import publicKey from './publicKey';
import script from './script';

export default (
  client: ClientBase,
  attributeLike: AttributeLike,
): Attribute => {
  if (typeof attributeLike !== 'object') {
    throw new InvalidArgumentError('attribute', attributeLike);
  }

  let usage;
  try {
    usage = toAttributeUsage(attributeLike.usage);
  } catch (error) {
    throw new InvalidArgumentError('attribute', attributeLike);
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
      value: script((attributeLike.value: $FlowFixMe)),
    });
  } else if (usage === 0x02 || usage === 0x03) {
    return new ECPointAttribute({
      usage,
      value: publicKey((attributeLike.value: $FlowFixMe)),
    });
  } else if (usage === 0x20) {
    return new UInt160Attribute({
      usage,
      value: hash160(client, (attributeLike.value: $FlowFixMe)),
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
      value: hash256((attributeLike.value: $FlowFixMe)),
    });
  }

  /* istanbul ignore next */
  throw new InvalidArgumentError('attribute', attributeLike);
};
