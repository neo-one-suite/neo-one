import TransportU2F from '@ledgerhq/hw-transport-u2f';
import { common, crypto, Witness as WitnessCore } from '@neo-one/client-core';
import { BufferString } from '../../../types';

interface LedgerResponse {
  readonly signature: Buffer;
  readonly status: Buffer;
}

const splitMessage = (messages: ReadonlyArray<Buffer>, length = 250): ReadonlyArray<Buffer> => {
  const message = messages[messages.length - 1];
  const index = Math.min(length, message.length);
  if (index !== length) {
    return messages.slice(0, messages.length - 1).concat(message);
  }

  return messages.slice(0, messages.length - 1).concat(message.slice(0, index), message.slice(index));
};

const getApdu = (message: Buffer, type: string) =>
  Buffer.concat([Buffer.from(`8002${type}00${message.length.toString(16)}`, 'hex'), message]);

export class LedgerU2FTransport {
  public readonly type: string = 'browser_ledger';
  public readonly byteLimit: number = 1024; // not sure what this should be yet
  public readonly path?: string;

  // private readonly bipp44Path = '8000002C' + '80000378' + '80000000' + '00000000' + '00000000';

  public constructor(path?: string) {
    this.path = path;
  }

  public async sign({ message, key }: { readonly message: Buffer; readonly key: BufferString }): Promise<WitnessCore> {
    const dongle = await this.getLedger();
    dongle.setScrambleKey('NEO');
    const response = await this.exchange(dongle, message);
    await dongle.close();

    return crypto.createWitnessForSignature(response.signature, common.asECPoint(key));
  }
  private async exchange(dongle: TransportU2F, message: Buffer): Promise<LedgerResponse> {
    if (message.length > this.byteLimit) {
      throw new Error(`Message size to large to be signed by the ledger`);
    }

    if (message.length === 0) {
      throw new Error(`No message received to exchange with ledger`);
    }

    const messages = splitMessage([message]);
    const initialMessages = messages.slice(0, messages.length - 1);
    const finalMessage = messages[messages.length - 1];

    await Promise.all(
      initialMessages.map(async (entry) => {
        await dongle.exchange(getApdu(entry, '00'));
      }),
    );

    const response = await dongle.exchange(getApdu(finalMessage, '80'));

    const ledgerResponse: LedgerResponse = {
      signature: response.slice(0, response.length - 2),
      status: response.slice(response.length - 2),
    };

    const statusString = ledgerResponse.status.toString('hex');
    switch (statusString) {
      case '9000': {
        return ledgerResponse;
      }
      case '6985': {
        throw new Error(`ledger response aborted by user, status: ${statusString}`);
      }
      default: {
        throw new Error(`Invalid ledger response status: ${statusString}`);
      }
    }
  }

  private async getLedger(): Promise<TransportU2F> {
    const paths = await TransportU2F.list();
    if (paths.length > 0) {
      if (this.path !== undefined && !paths.some((entry) => this.path === entry)) {
        throw new Error(`Specified path not found in ledger path list`);
      }
      const path = this.path !== undefined ? this.path : paths[0];

      return TransportU2F.open(path);
    }

    throw new Error(`no ledger paths found`);
  }
}
