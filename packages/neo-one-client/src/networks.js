/* @flow */
import { TRANSACTION_TYPE, common } from '@neo-one/core';

import { main, test } from '@neo-one/neo-settings';

import type { Network } from './types';

export const MAIN = {
  type: 'main',
  addressVersion: main.addressVersion,
  privateKeyVersion: main.privateKeyVersion,
  issueGASFee: common.fixed8ToDecimal(main.fees[TRANSACTION_TYPE.ISSUE]),
};
export const MAIN_URL = 'https://neotracker.io/rpc';

export const TEST = {
  type: 'test',
  addressVersion: test.addressVersion,
  privateKeyVersion: test.privateKeyVersion,
  issueGASFee: common.fixed8ToDecimal(test.fees[TRANSACTION_TYPE.ISSUE]),
};
export const TEST_URL = 'https://testnet.neotracker.io/rpc';

export const isEqual = (a: Network, b: Network): boolean =>
  a.type === b.type &&
  a.addressVersion === b.addressVersion &&
  a.privateKeyVersion === b.privateKeyVersion &&
  a.issueGASFee.equals(b.issueGASFee);
