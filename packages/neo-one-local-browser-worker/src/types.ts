import { comlink } from '@neo-one/worker';

export interface DisposableEndpoint {
  readonly endpoint: comlink.Endpoint;
  readonly dispose: () => void;
}
