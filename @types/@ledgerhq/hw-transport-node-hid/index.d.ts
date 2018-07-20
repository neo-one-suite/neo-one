declare module '@ledgerhq/hw-transport-node-hid';

export default class TransportNodeHid {
  public constructor(device: HID.HID, ledgerTransport?: boolean, timeout?: timeout);
  public static listen(observer: any): any;
  public static async list(): Promise<ReadonlyArray<string>>;
  public static async open(path: string): Promise<TransportNodeHid>;
  public setScrambleKey(): void;
  public async exchange(apdu: Buffer): Promise<Buffer>;
  public async close(): Promise<void>;
}
