// tslint:disable no-implicit-dependencies
// @ts-ignore
import regeneratorRuntime from 'regenerator-runtime';
import { Ledger } from '../common';

// tslint:disable-next-line no-let
let TransportNodeHidPromise: Promise<typeof import('@ledgerhq/hw-transport-node-hid')> | undefined;
const getTransportNodeHid = async () => {
  if (TransportNodeHidPromise === undefined) {
    // tslint:disable-next-line:no-object-mutation no-any
    (global as any).regeneratorRuntime = regeneratorRuntime;
    TransportNodeHidPromise = import('@ledgerhq/hw-transport-node-hid');
  }

  return TransportNodeHidPromise;
};

export const LedgerTransport: Ledger = {
  type: 'ledger',
  byteLimit: 256,
  load: async () => {
    try {
      const TransportNodeHid = await getTransportNodeHid();

      return {
        open: TransportNodeHid.default.open,
        list: TransportNodeHid.default.list,
        isSupported: TransportNodeHid.default.isSupported,
      };
    } catch {
      return {
        open: async () => Promise.reject(new Error('Not supported')),
        list: async () => Promise.reject(new Error('Not supported')),
        isSupported: async () => Promise.resolve(false),
      };
    }
  },
};
