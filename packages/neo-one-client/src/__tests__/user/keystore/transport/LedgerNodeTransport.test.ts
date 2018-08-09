import { LedgerNodeTransport } from '../../../../user/keystore/transports/LedgerNodeTransport';

describe('Ledger Node-Transport', () => {
  const message = Buffer.from('test'.repeat(11));
  const pubKey = '123123123123';

  const transport = new LedgerNodeTransport();

  test(`throws 'no ledger paths found'`, () => {
    expect(transport.sign({ message, key: pubKey })).rejects.toEqual(new Error(`no ledger paths found`));
  });
});
