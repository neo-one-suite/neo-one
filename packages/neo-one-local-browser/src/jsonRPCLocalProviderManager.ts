import { FullNodeOptions, JSONRPCLocalProvider, JSONRPCLocalProviderWorker } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { BehaviorSubject } from 'rxjs';

const options$ = new BehaviorSubject<FullNodeOptions>({ type: 'persistent', id: 'neo-one-node' });
export const jsonRPCLocalProviderManager = comlink.proxyValue(
  new WorkerManager<typeof JSONRPCLocalProvider>(JSONRPCLocalProviderWorker, options$),
);
