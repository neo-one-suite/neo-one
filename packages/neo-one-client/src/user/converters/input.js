/* @flow */
import { Input, common } from '@neo-one/client-core';

import type { Input as ClientInput } from '../../types';

export default (inputLike: ClientInput): Input =>
  new Input({
    hash: common.stringToUInt256(inputLike.txid),
    index: inputLike.vout,
  });
