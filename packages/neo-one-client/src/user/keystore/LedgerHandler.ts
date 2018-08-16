import { crypto } from '@neo-one/client-core';
import { HWLedger, LedgerTransport } from '@neo-one/client-switch';

export interface LedgerResponse {
  readonly message: Buffer;
  readonly status: Buffer;
}
const VALID_STATUS = 0x9000;
// const MSG_TOO_BIG = 0x6d08;
// const APP_CLOSED = 0x6e00;
// const TX_DENIED = 0x6985;
// const TX_PARSE_ERR = 0x6d07;

const BIP44 = (accountIn = 0) => {
  const account = accountIn.toString(16);

  return `8000002C800003788000000000000000${'0'.repeat(8 - account.length)}${account}`;
};

const getParams = (params: string) => {
  if (params.length !== 8) {
    throw new Error(`params requires 4 bytes`);
  }
  const paramsMatched = params.match(/.{1,2}/g);
  if (paramsMatched === null) {
    throw new Error(`send params got matched to null`);
  }

  return paramsMatched.map((val) => parseInt(val, 16));
};

export class LedgerHandler {
  public static readonly byteLimit = LedgerTransport.byteLimit;
  public static readonly type = LedgerTransport.type;

  public static readonly init = async () => {
    const isSupported = await LedgerTransport.isSupported();
    if (!isSupported) {
      throw new Error(`Ledger not supported by your machine`);
    }
    const paths = await LedgerTransport.list();
    if (paths.length === 0) {
      throw new Error(`No Ledger detected on your machine`);
    }
    const ledger = await LedgerTransport.open(paths[0]);

    return new LedgerHandler(ledger);
  };

  private readonly ledger: HWLedger;

  public constructor(ledger: HWLedger) {
    this.ledger = ledger;
  }

  public async getPublicKey(account = 0): Promise<string> {
    const response = await this.send('80040000', BIP44(account), [VALID_STATUS]);

    return crypto.toECPoint(response.message).toString('hex');
  }

  public async sign({ message, account }: { readonly message: string; readonly account: number }): Promise<string> {
    const data = message + BIP44(account);
    const chunks = data.match(/.{1,510}/g) || [];
    const initChunks = chunks.slice(0, chunks.length - 1);
    const finalChunk = chunks[chunks.length - 1];

    await Promise.all(
      initChunks.map(async (chunk) => {
        await this.send(`80020000`, chunk, [VALID_STATUS]);
      }),
    );

    const response = await this.send(`80028000`, finalChunk, [VALID_STATUS]);

    return response.message.toString('hex');
  }

  public async send(params: string, msg: string, statusList: ReadonlyArray<number>): Promise<LedgerResponse> {
    const [cla, ins, p1, p2] = getParams(params);
    try {
      const response = await this.ledger.send(cla, ins, p1, p2, Buffer.from(msg, 'hex'), statusList);

      return {
        message: response.slice(0, response.length - 2),
        status: response.slice(response.length - 2),
      };
    } catch (err) {
      throw err;
    }
  }

  public async close(): Promise<void> {
    this.ledger.close();
  }
}
