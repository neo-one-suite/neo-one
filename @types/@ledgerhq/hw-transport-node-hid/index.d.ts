declare module '@ledgerhq/hw-transport-node-hid';

export default class TransportNodeHid {
  public constructor(device: HID.HID, ledgerTransport?: boolean, timeout?: timeout);
  public static isSupported(): Promise<boolean>;
  public static async list(): Promise<ReadonlyArray<string>>;
  public static async open(path: string): Promise<TransportNodeHid>;
  public readonly send: (
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data: Buffer,
    statusList: ReadonlyArray<number>,
  ) => Promise<Buffer>;
  public async close(): Promise<void>;
}
