import { common, Input } from '@neo-one/client-core';
import { Input as ClientInput } from '../../types';

export const input = (inputLike: ClientInput): Input =>
  new Input({
    hash: common.stringToUInt256(inputLike.txid),
    index: inputLike.vout,
  });
