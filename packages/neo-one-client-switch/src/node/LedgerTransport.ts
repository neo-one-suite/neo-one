import { Ledger } from '../common';

// tslint:disable-next-line no-let
let TransportNodeHidPromise: Promise<typeof import('@ledgerhq/hw-transport-node-hid')> | undefined;
const getTransportNodeHid = async () => {
  if (TransportNodeHidPromise === undefined) {
    TransportNodeHidPromise = import('@ledgerhq/hw-transport-node-hid');
  }

  return TransportNodeHidPromise;
};

export const LedgerTransport: Ledger = {
  type: 'ledger',
  byteLimit: 256,
  load: async () => {
    const TransportNodeHid = await getTransportNodeHid();

    return {
      open: TransportNodeHid.default.open,
      list: TransportNodeHid.default.list,
      isSupported: TransportNodeHid.default.isSupported,
    };
  },
};
