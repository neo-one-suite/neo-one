/* @flow */
import { type UInt256, common } from '@neo-one/client-core';

import type { Hash256Like } from '../types';
import { InvalidArgumentError } from '../errors';

export default (hash: Hash256Like): UInt256 => {
  try {
    if (typeof hash === 'string') {
      return common.stringToUInt256(hash);
    } else if (hash instanceof Buffer) {
      return common.bufferToUInt256(hash);
    }

    return common.hexToUInt256(hash);
  } catch (error) {
    throw new InvalidArgumentError('hash256', hash);
  }
};
