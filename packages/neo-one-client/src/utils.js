/* @flow */
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

// eslint-disable-next-line
export const bigNumberToBN = (value: BigNumber, decimals: number): BN => {
  const dBigNumber = new BigNumber(10 ** decimals);
  return new BN(value.times(dBigNumber).toString(), 10);
};
