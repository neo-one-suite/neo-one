/* @flow */
import { Output } from '@neo-one/core';

import type ClientBase from '../ClientBase';
import { InvalidArgumentError } from '../errors';
import type { OutputLike } from '../types';

import hash160 from './hash160';
import hash256 from './hash256';
import number from './number';

export default (client: ClientBase, outputLike: OutputLike): Output => {
  if (typeof outputLike !== 'object') {
    throw new InvalidArgumentError('output', outputLike);
  }

  return new Output({
    address: hash160(client, outputLike.address),
    asset: hash256(outputLike.asset),
    value: number(outputLike.value, 8),
  });
};
