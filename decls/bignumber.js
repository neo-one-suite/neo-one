/* @flow */

type Base = number;

declare module 'bignumber.js' {
  declare type Number = number | string | BigNumber;
  declare class BigNumber {
    constructor(value: Number): BigNumber;

    abs(): BigNumber;
    ceil(): BigNumber;
    cmp(other: Number): number;
    decimalPlaces(): number;
    div(other: Number): BigNumber;
    dividedBy(other: Number): BigNumber;
    equals(other: Number): boolean;
    floor(): BigNumber;
    gt(other: Number): boolean;
    gte(other: Number): boolean;
    isFinite(): boolean;
    isInt(): boolean;
    isNaN(): boolean;
    isNegative(): boolean;
    isZero(): boolean;
    lt(other: Number): boolean;
    lte(other: Number): boolean;
    minus(other: Number): BigNumber;
    mod(other: Number): BigNumber;
    neg(): BigNumber;
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
