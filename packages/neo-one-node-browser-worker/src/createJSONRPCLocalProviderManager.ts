import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { JSONRPCLocalProviderWorker } from './JSONRPCLocalProviderWorker';

export const createJSONRPCLocalProviderManager = (id: string) =>
  comlink.proxyValue(
    new WorkerManager<typeof JSONRPCLocalProvider>(
      JSONRPCLocalProviderWorker,
      () => ({
        options: { type: 'persistent' as const, id: `neo-one-node-${id}` },
        disposables: [],
      }),
      300 * 1000,
    ),
  );

export const createMemoryJSONRPCLocalProviderManager = async () =>
  comlink.proxyValue(
    new WorkerManager<typeof JSONRPCLocalProvider>(
      JSONRPCLocalProviderWorker,
      () => ({ options: { type: 'memory' as const }, disposables: [] }),
      300 * 1000,
    ),
  );
