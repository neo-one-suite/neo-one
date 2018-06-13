import { Output, crypto, common } from '@neo-one/client-core';
import { Output as ClientOutput } from '../../types';
import * as clientUtils from '../../utils';

export const output = (
  outputLike: ClientOutput,
  addressVersion?: number,
): Output =>
  new Output({
    address: crypto.addressToScriptHash({
      address: outputLike.address,
      addressVersion:
        addressVersion == null ? common.NEO_ADDRESS_VERSION : addressVersion,
    }),
    asset: common.stringToUInt256(outputLike.asset),
    value: clientUtils.bigNumberToBN(outputLike.value, 8),
  });
