/* @flow */
import { Output, crypto, common } from '@neo-one/core';

import type { Output as ClientOutput } from '../../types'; // eslint-disable-line

import * as clientUtils from '../../utils';

export default (outputLike: ClientOutput, addressVersion: number): Output =>
  new Output({
    address: crypto.addressToScriptHash({
      address: outputLike.address,
      addressVersion,
    }),
    asset: common.stringToUInt256(outputLike.asset),
    value: clientUtils.bigNumberToBN(outputLike.value, 8),
  });
