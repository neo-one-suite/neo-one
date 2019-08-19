import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { JSONRPCLocalProviderWorker } from './JSONRPCLocalProviderWorker';

export const createJSONRPCLocalProviderManager = (id: string, build: () => Promise<void>) =>
  comlink.proxyValue(
    new WorkerManager<typeof JSONRPCLocalProvider>(
      JSONRPCLocalProviderWorker,
      () => ({
        options: { options: { type: 'persistent' as const, id: `neo-one-node-${id}` }, build },
        disposables: [],
      }),
      300 * 1000,
    ),
  );

export const createMemoryJSONRPCLocalProviderManager = async (build: () => Promise<void>) =>
  comlink.proxyValue(
    new WorkerManager<typeof JSONRPCLocalProvider>(
      JSONRPCLocalProviderWorker,
      () => ({ options: { options: { type: 'memory' as const }, build }, disposables: [] }),
      300 * 1000,
    ),
  );
