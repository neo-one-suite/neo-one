/* @flow */
import { type PrivateKey, common } from '@neo-one/client-core';

import type ClientBase from '../ClientBase';
import { InvalidArgumentError } from '../errors';
import type { PrivateKeyLike } from '../types';

export default (
  client: ClientBase,
  privateKeyLike: PrivateKeyLike,
): PrivateKey => {
  if (typeof privateKeyLike === 'string') {
    try {
      return common.stringToPrivateKey(client.wifToPrivateKey(privateKeyLike));
    } catch (error) {
      return common.stringToPrivateKey(privateKeyLike);
    }
  } else if (privateKeyLike instanceof Buffer) {
    return common.bufferToPrivateKey(privateKeyLike);
  }

  try {
    return common.hexToPrivateKey(privateKeyLike);
  } catch (error) {
    throw new InvalidArgumentError('privateKey', privateKeyLike);
  }
};
