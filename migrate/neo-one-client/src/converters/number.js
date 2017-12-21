/* @flow */
import type BN from 'bn.js';
import BigNumber from 'bignumber.js';

import { common } from '@neo-one/core';

import { InvalidArgumentError } from '../errors';
import type { NumberLike } from '../types';

export default (value: NumberLike, decimals: number): BN => {
  if (
    !(
      typeof value === 'number' ||
      typeof value === 'string' ||
      value instanceof BigNumber
    )
  ) {
    throw new InvalidArgumentError('number', value);
  }

  if (typeof decimals !== 'number') {
    throw new InvalidArgumentError('decimals', decimals);
  }

  return common.fixedFromDecimal(value, decimals);
};
