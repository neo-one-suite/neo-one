export function power(base: number, exp: number): number {
  let result = 1;
  while (exp) {
    // tslint:disable-next-line no-bitwise
    if ((exp & 1) === 1) {
      result *= base;
    }
    // tslint:disable-next-line no-bitwise
    exp >>= 1;
    base *= base;
  }

  return result;
}
