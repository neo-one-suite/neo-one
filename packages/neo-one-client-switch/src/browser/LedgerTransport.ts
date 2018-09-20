import TransportU2F from '@ledgerhq/hw-transport-u2f';
import { Ledger } from '../common';

export const LedgerTransport: Ledger = {
  type: 'ledger',
  byteLimit: 256,
  isSupported: TransportU2F.isSupported,
  list: TransportU2F.list,
  open: TransportU2F.open,
};
