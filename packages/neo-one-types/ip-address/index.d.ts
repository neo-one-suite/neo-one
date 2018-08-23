declare module 'ip-address' {
  export class Address6 {
    constructor(host: string);
    canonicalForm(): string | null | undefined;
    toByteArray(): number[];
    static fromAddress4(host: string): Address6 | null | undefined;
    static fromByteArray(value: number[]): Address6 | null | undefined;
  }
}
