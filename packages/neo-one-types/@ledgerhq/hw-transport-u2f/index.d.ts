declare module '@ledgerhq/hw-transport-u2f' {
  export default class TransportU2F {
    public constructor();
    public static isSupported(): Promise<boolean>;
    public static async list(): Promise<ReadonlyArray<string>>;
    public static async open(path: string, _openTimeout?: number): Promise<TransportU2F>;
    public setScrambleKey(key: string): void;
    public exchange: (apdu: Buffer) => Promise<Buffer>;
    public async close(): Promise<void>;
  }
}
