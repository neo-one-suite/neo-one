import { bigNumberToBN, common, Output } from '@neo-one/client-core';
import { addressToScriptHash } from '../../helpers';
import { Output as ClientOutput } from '../../types';

export const output = (outputLike: ClientOutput): Output =>
  new Output({
    address: common.stringToUInt160(addressToScriptHash(outputLike.address)),
    asset: common.stringToUInt256(outputLike.asset),
    value: bigNumberToBN(outputLike.value, 8),
  });
