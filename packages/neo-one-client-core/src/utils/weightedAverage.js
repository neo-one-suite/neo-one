/* @flow */
import BigNumber from 'bignumber.js';

export default (
  input: Array<{|
    value: number,
    weight: BigNumber,
  |}>,
): number => {
  let sumWeight = new BigNumber(0);
  let sumValue = new BigNumber(0);
  for (const value of input) {
    sumWeight = sumWeight.plus(value.weight);
    sumValue = sumValue.plus(value.weight.times(value.value));
  }

  if (sumValue.equals(0) || sumWeight.equals(0)) {
    return 0;
  }
  return sumValue
    .div(sumWeight)
    .floor()
    .toNumber();
};
