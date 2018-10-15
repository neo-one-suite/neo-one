import { FullNodeOptions, JSONRPCLocalProvider, JSONRPCLocalProviderWorker } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { BehaviorSubject } from 'rxjs';

export const createJSONRPCLocalProviderManager = (id: string) =>
  comlink.proxyValue(
    new WorkerManager<typeof JSONRPCLocalProvider>(
      JSONRPCLocalProviderWorker,
      new BehaviorSubject<() => FullNodeOptions>(() => ({ type: 'persistent', id: `neo-one-node-${id}` })),
      30 * 1000,
    ),
  );
