import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { Ledger } from '../common';

export const LedgerTransport: Ledger = {
  type: 'ledger',
  byteLimit: 256,
  open: TransportNodeHid.open,
  list: TransportNodeHid.list,
  isSupported: TransportNodeHid.isSupported,
};
