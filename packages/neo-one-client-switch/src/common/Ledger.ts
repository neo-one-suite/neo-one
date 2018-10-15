export interface HWLedger {
  readonly setScrambleKey: (key: string) => void;
  readonly exchange: (apdu: Buffer) => Promise<Buffer>;
  readonly close: () => Promise<void>;
}

export interface Ledger {
  readonly type: string;
  readonly byteLimit: number;
  readonly load: () => Promise<{
    readonly open: (path: string) => Promise<HWLedger>;
    readonly list: () => Promise<ReadonlyArray<string>>;
    readonly isSupported: () => Promise<boolean>;
  }>;
}
