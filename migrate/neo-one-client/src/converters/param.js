/* @flow */
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import type { Param } from '@neo-one/core';

import type ClientBase from '../ClientBase';
import { InvalidParamError } from '../errors';
import type { ParamLike } from '../types';

import hash160 from './hash160';
import hash256 from './hash256';

const tryConvertHash160 = (client: ClientBase, param: ParamLike): ?Param => {
  try {
    return hash160(client, (param: $FlowFixMe));
  } catch (error) {
    // eslint-disable-next-line
  }

  return null;
};

const tryConvertHash256 = (param: ParamLike): ?Param => {
  try {
    return hash256((param: $FlowFixMe));
  } catch (error) {
    // eslint-disable-next-line
  }

  return null;
};

const convert = (client: ClientBase, param: ParamLike): Param => {
  if (Array.isArray(param)) {
    // $FlowFixMe
    return param.map(value => convert(client, value));
  }

  if (param instanceof BN) {
    return param;
  }

  if (param instanceof BigNumber) {
    if (!param.isInteger()) {
      throw new InvalidParamError(
        `BigNumber param must be an integer: ${param.toString()}`,
      );
    }
    return new BN(param.toString(), 10);
  }

  if (typeof param === 'number') {
    if (!Number.isSafeInteger(param)) {
      throw new InvalidParamError(`Number param must be an integer: ${param}`);
    }
    return new BN(param);
  }

  if (typeof param === 'boolean') {
    return param;
  }

  if (typeof param === 'string') {
    if (param.startsWith('0x')) {
      const hash160Result = tryConvertHash160(client, param);
      if (hash160Result != null) {
        return hash160Result;
      }

      const hash256Result = tryConvertHash256(param);
      if (hash256Result != null) {
        return hash256Result;
      }
    }

    try {
      const value = new BN(param, 10);
      if (value.toString(10) === param) {
        return value;
      }
    } catch (error) {
      // eslint-disable-next-line
    }

    return param;
  }

  // At this point we know it's a Buffer, though not sure if it's a Hash160,
  // Hash256, ECPoint or a plain Buffer. Fortunately, all of them are
  // serialized the same (little endian) so we can just pass it through.
  if (param instanceof Buffer) {
    return param;
  }

  throw new InvalidParamError(`Unknown Param type: ${String(param)}`);
};

export default convert;
