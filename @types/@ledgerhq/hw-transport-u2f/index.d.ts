declare module '@ledgerhq/hw-transport-u2f';

export default class TransportU2F {
  public constructor();
  public static listen(observer: any): any;
  public static async list(): Promise<ReadonlyArray<string>>;
  public static async open(path: string, _openTimeout?: number): Promise<TransportU2F>;
  public setScrambleKey(key: string): void;
  public async exchange(buffer: Buffer): Promise<Buffer>;
  public async close(): Promise<void>;
}
