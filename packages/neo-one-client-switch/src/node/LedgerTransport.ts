import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { Ledger } from '../common';

const ledgerNodeTransport: Ledger = {
  type: `node`,
  byteLimit: 256,
  open: TransportNodeHid.open,
  list: TransportNodeHid.list,
  isSupported: TransportNodeHid.isSupported,
};

export { ledgerNodeTransport as LedgerTransport };
