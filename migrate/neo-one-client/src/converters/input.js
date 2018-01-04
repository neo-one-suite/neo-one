/* @flow */
import { Input } from '@neo-one/client-core';

import { InvalidArgumentError } from '../errors';
import type { InputLike } from '../types';

import hash256 from './hash256';

export default (inputLike: InputLike): Input => {
  if (typeof inputLike !== 'object') {
    throw new InvalidArgumentError('input', inputLike);
  }

  if (typeof inputLike.vout !== 'number') {
    throw new InvalidArgumentError('input', inputLike);
  }

  return new Input({
    hash: hash256(inputLike.txid),
    index: inputLike.vout,
  });
};
