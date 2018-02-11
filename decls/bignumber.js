/* @flow */

type Base = number;

opaque type BigNumberRound =
  0 |
  1 |
  2 |
  3 |
  4 |
  5 |
  6 |
  7 |
  8 |
  9;

declare module 'bignumber.js' {
  declare type Number = number | string | BigNumber;
  declare class BigNumber {
    static ROUND_UP: BigNumberRound;
    static ROUND_DOWN: BigNumberRound;
    static ROUND_CEIL: BigNumberRound;
    static ROUND_FLOOR: BigNumberRound;
    static ROUND_HALF_UP: BigNumberRound;
    static ROUND_HALF_DOWN: BigNumberRound;
    static ROUND_HALF_EVEN: BigNumberRound;
    static ROUND_HALF_CEIL: BigNumberRound;
    static ROUND_HALF_FLOOR: BigNumberRound;
    static EUCLID: BigNumberRound;
    static isBigNumber(value: mixed): boolean;

    constructor(value: Number): BigNumber;

    abs(): BigNumber;
    comparedTo(other: BigNumber): number;
    decimalPlaces(): number;
    div(other: Number): BigNumber;
    dividedBy(other: Number): BigNumber;
    gt(other: Number): boolean;
    gte(other: Number): boolean;
    integerValue(round?: BigNumberRound): BigNumber;
    isEqualTo(other: Number): boolean;
    isFinite(): boolean;
    isInteger(): boolean;
    isNaN(): boolean;
    isNegative(): boolean;
    isZero(): boolean;
    lt(other: Number): boolean;
    lte(other: Number): boolean;
    minus(other: Number): BigNumber;
    mod(other: Number): BigNumber;
    negated(): BigNumber;
    plus(other: Number): BigNumber;
    pow(other: Number): BigNumber;
    precision(): number;
    times(other: Number): BigNumber;
    toFixed(dp: number): string;
    toFormat(dp?: number): string;
    toNumber(): number;
    toString(base?: Base): string;
  }
  declare module.exports: Class<BigNumber>;
}
