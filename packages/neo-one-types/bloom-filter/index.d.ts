declare module 'bloom-filter' {
  export default class BloomFilter {
    constructor(options: { vData: Buffer; nHashFuncs: number; nTweak: number });
    insert(value: Buffer): void;
    contains(value: Buffer): boolean;
  }
}
