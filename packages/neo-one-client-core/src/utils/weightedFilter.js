/* @flow */
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

export default function weightedFilter<T>(
  input: Array<T>,
  startIn: number,
  endIn: number,
  getValueIn: (value: T) => BN,
): Array<[T, BigNumber]> {
  const start = new BigNumber(startIn);
  const end = new BigNumber(endIn);
  const getValue = (value: T) => new BigNumber(getValueIn(value).toString(10));
  const amount = input.reduce(
    (acc, value) => acc.plus(getValue(value)),
    new BigNumber(0),
  );
  let sum = new BigNumber(0);
  let current = new BigNumber(0);
  const result = [];
  for (const value of input) {
    if (current.gte(end)) {
      break;
    }
    let weight = getValue(value);
    sum = sum.plus(weight);
    const old = current;
    current = sum.div(amount);
    if (current.lte(start)) {
      // eslint-disable-next-line
      continue;
    }
    if (old.lt(start)) {
      if (current.gt(end)) {
        weight = end.minus(start).times(amount);
      } else {
        weight = current.minus(start).times(amount);
      }
    } else if (current.gt(end)) {
      weight = end.minus(old).times(amount);
    }

    result.push([
      value,
      weight.gte(0)
        ? weight.integerValue(BigNumber.ROUND_FLOOR)
        : weight.integerValue(BigNumber.ROUND_CEIL),
    ]);
  }

  return result;
}
