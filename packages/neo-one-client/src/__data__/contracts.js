/* @flow */
import BigNumber from 'bignumber.js';

import { bigNumberToBN } from '../utils';

export default {
  Signature: {
    type: 'Signature',
    value: '02028a99826ed',
  },
  Boolean: { type: 'Boolean', value: true },
  Integer: {
    type: 'Integer',
    value: bigNumberToBN(new BigNumber('10'), 10),
  },
  Hash160: {
    type: 'Hash160',
    value: '0x3775292229eccdf904f16fff8e83e7cffdc0f0ce',
  },
  Hash256: {
    type: 'Hash256',
    value: '0x798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
  },
  ByteArray: {
    type: 'ByteArray',
    value: '02028a99826ed',
  },
  PublicKey: {
    type: 'PublicKey',
    value: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
  },
  String: {
    type: 'String',
    value: 'stringVal',
  },
  Array: {
    type: 'Array',
    value: [{ type: 'String', value: 'stringVal' }],
  },
  InteropInterface: { type: 'InteropInterface' },
  Void: { type: 'Void' },
};
