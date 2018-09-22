import { addressToScriptHash, common, Output, OutputModel, utils } from '@neo-one/client-common';

export const output = (outputLike: Output): OutputModel =>
  new OutputModel({
    address: common.stringToUInt160(addressToScriptHash(outputLike.address)),
    asset: common.stringToUInt256(outputLike.asset),
    value: utils.bigNumberToBN(outputLike.value, 8),
  });
