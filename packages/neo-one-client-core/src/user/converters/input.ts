import { common, Input, InputModel } from '@neo-one/client-common';

export const input = (inputLike: Input): InputModel =>
  new InputModel({
    hash: common.stringToUInt256(inputLike.hash),
    index: inputLike.index,
  });
