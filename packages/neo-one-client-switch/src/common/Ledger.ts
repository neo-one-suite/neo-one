export interface HWLedger {
  readonly setScrambleKey?: (key: string) => void;
  readonly send: (
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data: Buffer,
    statusList: ReadonlyArray<number>,
  ) => Promise<Buffer>;
  readonly close: () => Promise<void>;
}

export interface Ledger {
  readonly type: string;
  readonly byteLimit: number;
  readonly open: (path: string) => Promise<HWLedger>;
  readonly list: () => Promise<ReadonlyArray<string>>;
  readonly isSupported: () => Promise<boolean>;
}
