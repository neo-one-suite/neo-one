/* @flow */
import { Witness } from '@neo-one/core';

import { InvalidArgumentError } from '../errors';
import type { WitnessLike } from '../types';

import script from './script';

export default (witnessLike: WitnessLike): Witness => {
  if (typeof witnessLike !== 'object') {
    throw new InvalidArgumentError('witness', witnessLike);
  }

  return new Witness({
    invocation: script(witnessLike.invocation),
    verification: script(witnessLike.verification),
  });
};
