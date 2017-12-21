/* @flow */
import { Input, common } from '@neo-one/core';

import type { Input as ClientInput } from '../../types'; // eslint-disable-line

export default (inputLike: ClientInput): Input =>
  new Input({
    hash: common.stringToUInt256(inputLike.txid),
    index: inputLike.vout,
  });
