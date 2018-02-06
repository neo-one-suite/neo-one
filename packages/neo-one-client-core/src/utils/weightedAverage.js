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

  if (sumValue.isEqualTo(0) || sumWeight.isEqualTo(0)) {
    return 0;
  }
  return sumValue
    .div(sumWeight)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();
};
