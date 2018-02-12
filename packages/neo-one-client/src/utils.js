/* @flow */
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import {
  type Param as ScriptBuilderParam,
  ScriptBuilder,
  common,
} from '@neo-one/client-core';

import type { Hash160String } from './types';

export const bigNumberToBN = (value: BigNumber, decimals: number): BN => {
  const dBigNumber = new BigNumber(10 ** decimals);
  return new BN(value.times(dBigNumber).toString(), 10);
};

export const getInvokeMethodInvocationScript = ({
  method,
  params,
}: {|
  method: string,
  params: Array<?ScriptBuilderParam>,
|}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCallInvocation(method, ...params);

  return sb.build();
};

export const getInvokeMethodScript = ({
  hash,
  method,
  params,
}: {|
  hash: Hash160String,
  method: string,
  params: Array<?ScriptBuilderParam>,
|}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCall(common.stringToUInt160(hash), method, ...params);

  return sb.build();
};
