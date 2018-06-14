import { common, Param as ScriptBuilderParam, ScriptBuilder } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { Hash160String } from './types';

export const bigNumberToBN = (value: BigNumber, decimals: number): BN => {
  const dBigNumber = new BigNumber(10 ** decimals);

  return new BN(value.times(dBigNumber).toString(), 10);
};

export const getInvokeMethodInvocationScript = ({
  method,
  params,
}: {
  readonly method: string;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCallInvocation(method, ...params);

  return sb.build();
};

export const getInvokeMethodScript = ({
  hash,
  method,
  params,
}: {
  readonly hash: Hash160String;
  readonly method: string;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCall(common.stringToUInt160(hash), method, ...params);

  return sb.build();
};
