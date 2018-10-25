import { FullNodeOptions, JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { JSONRPCLocalProviderWorker } from './JSONRPCLocalProviderWorker';

export const createJSONRPCLocalProviderManager = (id: string) =>
  comlink.proxyValue(
    new WorkerManager<typeof JSONRPCLocalProvider>(
      JSONRPCLocalProviderWorker,
      () => ({
        // tslint:disable-next-line:no-object-literal-type-assertion
        options: { type: 'persistent', id: `neo-one-node-${id}` } as FullNodeOptions,
        disposables: [],
      }),
      300 * 1000,
    ),
  );
