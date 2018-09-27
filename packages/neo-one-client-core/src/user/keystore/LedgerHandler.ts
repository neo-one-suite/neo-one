import { crypto, PublicKeyString } from '@neo-one/client-common';
import { HWLedger, LedgerTransport } from '@neo-one/client-switch';
import { LedgerNotDetectedError, LedgerNotSupportedError, LedgerStatusCodeError } from '../../errors';

export interface LedgerQueueRequest {
  readonly msg: Buffer;
  readonly resolve: (value: Buffer) => void;
  readonly reject: (error: Error) => void;
}

const keyRequestParams = Buffer.from('80040000', 'hex');
const initMessageParams = Buffer.from('80020000', 'hex');
const finalMessageParams = Buffer.from('80028000', 'hex');

const BIP44 = (accountIn = 0): Buffer => {
  const account = accountIn.toString(16);

  return Buffer.from(`8000002C800003788000000000000000${'0'.repeat(8 - account.length)}${account}`, 'hex');
};

const chunkBuffer = (buffer: Buffer, chunkLength: number): ReadonlyArray<Buffer> => {
  if (buffer.length > chunkLength) {
    return [buffer.slice(0, chunkLength)].concat(chunkBuffer(buffer.slice(chunkLength), chunkLength));
  }

  return [buffer];
};

export class LedgerHandler {
  public static readonly byteLimit = LedgerTransport.byteLimit;
  public static readonly type = LedgerTransport.type;

  public static readonly init = async () => {
    const isSupported = await LedgerTransport.isSupported();
    if (!isSupported) {
      throw new LedgerNotSupportedError();
    }
    const paths = await LedgerTransport.list();
    if (paths.length === 0) {
      throw new LedgerNotDetectedError();
    }
    const ledger = await LedgerTransport.open(paths[0]);
    ledger.setScrambleKey('NEO');

    return new LedgerHandler(ledger);
  };

  private readonly ledger: HWLedger;
  private readonly mutableQueue: LedgerQueueRequest[];
  private mutableRunning: boolean;

  private constructor(ledger: HWLedger) {
    this.ledger = ledger;
    this.mutableRunning = false;
    this.mutableQueue = [];
  }

  public async getPublicKey(account = 0): Promise<PublicKeyString> {
    const response = await this.send(Buffer.concat([keyRequestParams, Buffer.from('14', 'hex'), BIP44(account)]));

    return crypto.toECPoint(response).toString('hex');
  }

  public async sign({ message, account }: { readonly message: Buffer; readonly account: number }): Promise<Buffer> {
    const data = Buffer.concat([message, BIP44(account)]);
    const chunks = chunkBuffer(data, 250);
    const initChunks = chunks.slice(0, chunks.length - 1);
    const finalChunk = chunks[chunks.length - 1];

    await Promise.all(
      initChunks.map(async (chunk) => {
        await this.send(Buffer.concat([initMessageParams, Buffer.from([chunk.length]), chunk]));
      }),
    );

    return this.send(
      Buffer.concat([finalMessageParams, Buffer.from(finalChunk.length.toString(16), 'hex'), finalChunk]),
    );
  }

  public async close(): Promise<void> {
    await this.ledger.close();
  }

  private async send(msg: Buffer): Promise<Buffer> {
    // tslint:disable-next-line:promise-must-complete
    const promise = new Promise<Buffer>((resolve, reject) => {
      this.mutableQueue.push({
        msg,
        resolve,
        reject,
      });
    });

    this.startSendLoop().catch(() => {
      // do nothing
    });

    return promise;
  }

  private async startSendLoop(): Promise<void> {
    if (this.mutableRunning) {
      return;
    }

    this.mutableRunning = true;

    let entry = this.mutableQueue.shift();
    // tslint:disable-next-line:no-loop-statement
    while (entry !== undefined) {
      try {
        const result = await this.doSend(entry.msg);
        entry.resolve(result);
      } catch (error) {
        entry.reject(error);
      }
      entry = this.mutableQueue.shift();
    }

    this.mutableRunning = false;
  }

  private async doSend(msg: Buffer): Promise<Buffer> {
    const response = await this.ledger.exchange(msg);

    const status = response.slice(response.length - 2);
    if (status.toString('hex') !== '9000') {
      throw new LedgerStatusCodeError(status.toString('hex'));
    }

    return response.slice(0, response.length - 2);
  }
}
