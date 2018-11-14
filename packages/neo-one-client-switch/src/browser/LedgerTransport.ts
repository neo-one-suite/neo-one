import { Ledger } from '../common';

// tslint:disable-next-line no-let
let TransportNodeU2FPromise: Promise<typeof import('@ledgerhq/hw-transport-u2f')> | undefined;
const getTransportNodeU2F = async () => {
  if (TransportNodeU2FPromise === undefined) {
    TransportNodeU2FPromise = import('@ledgerhq/hw-transport-u2f');
  }

  return TransportNodeU2FPromise;
};

export const LedgerTransport: Ledger = {
  type: 'ledger',
  byteLimit: 256,
  load: async () => {
    const TransportNodeU2F = await getTransportNodeU2F();

    return {
      open: TransportNodeU2F.default.open,
      list: TransportNodeU2F.default.list,
      isSupported: TransportNodeU2F.default.isSupported,
    };
  },
};
