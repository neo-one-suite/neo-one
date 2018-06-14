import BigNumber from 'bignumber.js';
import BN from 'bn.js';

export function weightedFilter<T>(
  input: ReadonlyArray<T>,
  startIn: number,
  endIn: number,
  getValueIn: (value: T) => BN,
): ReadonlyArray<[T, BigNumber]> {
  const start = new BigNumber(startIn);
  const end = new BigNumber(endIn);
  const getValue = (value: T) => new BigNumber(getValueIn(value).toString(10));
  const amount = input.reduce((acc, value) => acc.plus(getValue(value)), new BigNumber(0));

  let sum = new BigNumber(0);
  let current = new BigNumber(0);
  const mutableResult: Array<[T, BigNumber]> = [];
  // tslint:disable-next-line no-loop-statement
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
      weight = current.gt(end) ? end.minus(start).times(amount) : current.minus(start).times(amount);
    } else if (current.gt(end)) {
      weight = end.minus(old).times(amount);
    }

    mutableResult.push([
      value,
      weight.gte(0) ? weight.integerValue(BigNumber.ROUND_FLOOR) : weight.integerValue(BigNumber.ROUND_CEIL),
    ]);
  }

  return mutableResult;
}
