/* @flow */
import BN from 'bn.js';
import { type Param, common } from '@neo-one/core';

import { InvalidArgumentError } from '../../errors';
import type { ParamInternal as ClientParam } from '../../types'; // eslint-disable-line

const tryConvertHash160 = (param: string): ?Param => {
  try {
    return common.stringToUInt160(param);
  } catch (error) {
    // eslint-disable-next-line
  }

  return null;
};

const tryConvertHash256 = (param: string): ?Param => {
  try {
    return common.stringToUInt256(param);
  } catch (error) {
    // eslint-disable-next-line
  }

  return null;
};

const convert = (param: ?ClientParam): ?Param => {
  if (param == null) {
    return param;
  }

  if (Array.isArray(param)) {
    return param.map(value => convert(value));
  }

  if (BN.isBN(param)) {
    return param;
  }

  if (typeof param === 'boolean') {
    return param;
  }

  if (typeof param === 'string') {
    if (param.startsWith('0x')) {
      const hash160Result = tryConvertHash160(param);
      if (hash160Result != null) {
        return hash160Result;
      }

      const hash256Result = tryConvertHash256(param);
      if (hash256Result != null) {
        return hash256Result;
      }
    }

    try {
      return Buffer.from(param, 'hex');
    } catch (error) {
      // eslint-disable-next-line
    }

    return param;
  }

  throw new InvalidArgumentError(`Unknown Param type: ${String(param)}`);
};

export default convert;
