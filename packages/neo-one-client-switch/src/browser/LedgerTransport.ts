import TransportU2F from '@ledgerhq/hw-transport-u2f';
import { Ledger } from '../common';

const ledgerU2FTransport: Ledger = {
  type: `u2f`,
  byteLimit: 256,
  isSupported: TransportU2F.isSupported,
  list: TransportU2F.list,
  open: TransportU2F.open,
};

export { ledgerU2FTransport as LedgerTransport };
