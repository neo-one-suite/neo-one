interface WIF {
  encode(version: number, value: Buffer, compressed: boolean): string;
  decode(value: string, version: number): Buffer;
}

declare const WIF: WIF;
export default WIF;
