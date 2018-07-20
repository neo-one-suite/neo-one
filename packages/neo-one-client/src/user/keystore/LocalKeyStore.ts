import { LocalTransport } from './transports/LocalTransport';
import { Store, TransportStore } from './TransportStore';

export class LocalKeyStore extends TransportStore {
  public constructor({ store }: { readonly store: Store }) {
    super({
      store,
      transport: LocalTransport,
    });
  }
}
