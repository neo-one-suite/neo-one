/* @flow */
import { type ECPoint, common, crypto } from '@neo-one/client-core';

import { InvalidArgumentError } from '../errors';
import type { PublicKeyLike } from '../types';

export default (publicKeyLike: PublicKeyLike): ECPoint => {
  if (typeof publicKeyLike === 'string') {
    return common.stringToECPoint(publicKeyLike);
  } else if (publicKeyLike instanceof Buffer) {
    return crypto.toECPoint(publicKeyLike);
  }

  try {
    return common.hexToECPoint(publicKeyLike);
  } catch (error) {
    throw new InvalidArgumentError('publicKey', publicKeyLike);
  }
};
