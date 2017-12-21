/* @flow */
import type ClientBase from '../ClientBase';
import { InvalidArgumentError } from '../errors';
import type { AddressLike } from '../types';

export default (client: ClientBase, hash: AddressLike): string => {
  try {
    if (typeof hash === 'string') {
      try {
        // Check if we can convert it to a valid script hash.
        client.addressToScriptHash(hash);
        return hash;
      } catch (error) {
        // Do nothing
      }
    }

    // Must be a script hash
    return client.scriptHashToAddress(hash);
  } catch (error) {
    throw new InvalidArgumentError('address', hash);
  }
};
