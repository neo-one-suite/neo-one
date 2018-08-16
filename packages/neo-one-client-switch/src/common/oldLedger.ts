const BIP44 = (accountIn = 0): string => {
  const account = accountIn.toString(16);

  return `8000002C800003788000000000000000${'0'.repeat(8 - account.length)}${account}`;
};

export interface LedgerResponse {
  readonly message: Buffer;
  readonly status: Buffer;
}

export interface LedgerOptions {
  readonly type: string;
  readonly byteLimit: number;
  readonly ledgerTransport: HWLedgerTransport;
}

export interface HWLedgerTransport {
  readonly list: () => Promise<ReadonlyArray<string>>;
  readonly open: (path: string, _openTimeout?: number) => Promise<HWLedger>;
}

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

export abstract class Ledger {
  public readonly type: string;
  public readonly byteLimit: number;

  private readonly ledgerTransport: HWLedgerTransport;

  public constructor(options: LedgerOptions) {
    this.type = options.type;
    this.byteLimit = options.byteLimit;
    this.ledgerTransport = options.ledgerTransport;
  }

  public async getLedgerPaths(): Promise<ReadonlyArray<string>> {
    return this.ledgerTransport.list();
  }

  public async getPublicKey(path: string, account = 0): Promise<string> {
    const ledger = await this.openLedger(path);
    const response = await this.send({
      ledger,
      params: '80040000',
      message: Buffer.from(BIP44(account), 'hex'),
      statusList: [0x9000],
    });

    return response.toString('hex').slice(0, 130);
  }

  private async openLedger(path: string): Promise<HWLedger> {
    try {
      return this.ledgerTransport.open(path);
    } catch {
      throw new Error(`no ledger found at path ${path}`);
    }
  }

  private async send({
    ledger,
    params,
    message,
    statusList,
  }: {
    readonly ledger: HWLedger;
    readonly params: string;
    readonly message: Buffer;
    readonly statusList: ReadonlyArray<number>;
  }): Promise<Buffer> {
    if (params.length !== 8) {
      throw new Error(`params requires 4 bytes`);
    }

    const decodedParams = params.match(/.{1,2}/g);
    if (decodedParams === null) {
      throw new Error('got null params');
    }
    const [cla, ins, p1, p2] = decodedParams.map((val) => parseInt(val, 16));

    try {
      return await ledger.send(cla, ins, p1, p2, message, statusList);
    } catch (err) {
      throw err;
    }
  }
}
