/* @flow */
declare module 'bn.js' {
  declare type Endian = 'be' | 'le';
  declare class BN {
    constructor(value: number): BN;
    constructor(value: Buffer, endian: Endian): BN;
    constructor(value: string, base: number): BN;
    constructor(value: BN): BN;

    neg(): BN;
    ineg(): BN;
    abs(): BN;
    iabs(): BN;
    add(b: BN): BN;
    iadd(b: BN): BN;
    addn(b: number): BN;
    iaddn(b: number): BN;
    sub(b: BN): BN;
    isub(b: BN): BN;
    subn(b: number): BN;
    isubn(b: number): BN;
    mul(b: BN): BN;
    imul(b: BN): BN;
    muln(b: number): BN;
    imuln(b: number): BN;
    sqr(): BN;
    isqr(): BN;
    pow(b: BN): BN;
    div(b: BN): BN;
    divn(b: number): BN;
    idivn(b: number): BN;
    mod(b: BN): BN;
    imod(b: BN): BN;
    umod(b: BN): BN;
    modn(b: number): number;
    divRound(b: BN): BN;

    // TODO: We don't allow these because C#'s BigInteger stores negative
    //       values as 2's complement and positive values as sign + magnitude
    //       with a leading 0. To avoid accidentally using a bitwise operation
    //       on a BN where the underlying storage does not match C#, we pretend
    //       these operations do not exist.
    // or(b: BN): BN;
    // ior(b: BN): BN;
    // uor(b: BN): BN;
    // iuor(b: BN): BN;
    // and(b: BN): BN;
    // iand(b: BN): BN;
    // uand(b: BN): BN;
    // iuand(b: BN): BN;
    // andln(b: number): BN;
    // xor(b: BN): BN;
    // ixor(b: BN): BN;
    // uxor(b: BN): BN;
    // iuxor(b: BN): BN;
    // setn(b: number, val: number): BN;
    // shln(b: number): BN;
    // ishln(b: number): BN;
    // ushln(b: number): BN;
    // iushln(b: number): BN;
    // shrn(b: number): BN;
    // ishrn(b: number): BN;
    // ushrn(b: number): BN;
    // iushrn(b: number): BN;
    // testn(b: number): BN;
    // maskn(b: number): BN;
    // imaskn(b: number): BN;
    // bincn(b: number): BN;
    // notn(b: number): BN;
    // inotn(b: number): BN;

    // TODO: Not sure what the types of these are
    // gcd(b: BN): BN;
    // egcd(b: BN): BN;
    // invm(b: BN): BN;

    clone(): BN;
    toString(base: number, length?: number): string;
    toNumber(): number;
    toJSON(): string;
    toArray(endian: Endian, length?: number): Array<number>;
    toArrayLike(type: Class<Buffer>, endian: Endian, length?: number): Buffer;
    toBuffer(endian: Endian, length?: number): Buffer;
    bitLength(): number;
    zeroBits(): number;
    byteLength(): number;
    isNeg(): boolean;
    isEven(): boolean;
    isOdd(): boolean;
    isZero(): boolean;
    cmp(b: BN): number;
    lt(b: BN): boolean;
    lte(b: BN): boolean;
    gt(b: BN): boolean;
    gte(b: BN): boolean;
    eq(b: BN): boolean;
    toTwos(width: number): BN;
    fromTwos(width: number): BN;

    static isBN(value: any): boolean;
    static min(a: BN, b: BN): BN;
    static max(a: BN, b: BN): BN;
  }
  declare module.exports: Class<BN>;
}
