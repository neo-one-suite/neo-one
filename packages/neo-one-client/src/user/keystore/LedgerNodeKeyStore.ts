import { LedgerNodeTransport } from './transports/LedgerNodeTransport';
import { Store, TransportStore } from './TransportStore';

export class LedgerNodeKeyStore extends TransportStore {
  public constructor({ store, path }: { readonly store: Store; readonly path: string }) {
    super({
      store,
      transport: new LedgerNodeTransport(path),
    });
  }
}
