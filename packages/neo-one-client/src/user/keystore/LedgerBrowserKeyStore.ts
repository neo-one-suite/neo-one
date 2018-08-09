import { LedgerU2FTransport } from './transports/LedgerU2FTransport';
import { Store, TransportStore } from './TransportStore';

export class LedgerBrowserKeyStore extends TransportStore {
  public constructor({ store, path }: { readonly store: Store; readonly path: string }) {
    super({
      store,
      transport: new LedgerU2FTransport(path),
    });
  }
}
