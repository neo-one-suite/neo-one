/* @flow */
import { type UInt160, common } from '@neo-one/client-core';

import type ClientBase from '../ClientBase';
import { InvalidArgumentError } from '../errors';
import type { Hash160Like } from '../types';

export default (client: ClientBase, hash: Hash160Like): UInt160 => {
  try {
    if (typeof hash === 'string') {
      try {
        return common.stringToUInt160(client.addressToScriptHash(hash));
      } catch (error) {
        return common.stringToUInt160(hash);
      }
    } else if (hash instanceof Buffer) {
      return common.bufferToUInt160(hash);
    }

    return common.hexToUInt160(hash);
  } catch (error) {
    throw new InvalidArgumentError('hash160', hash);
  }
};
