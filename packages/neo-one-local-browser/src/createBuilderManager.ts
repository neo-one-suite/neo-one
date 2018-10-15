import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { Builder, BuilderWorker } from './build';
import { OutputMessage } from './types';

export const createBuilderManager = (
  dbID: string,
  endpoint: () => comlink.Endpoint,
  output$: Subject<OutputMessage>,
  jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>,
) =>
  comlink.proxyValue(
    new WorkerManager<typeof Builder>(
      BuilderWorker,
      new BehaviorSubject(() => ({
        dbID,
        endpoint: endpoint(),
        output$: comlink.proxyValue(output$),
        jsonRPCLocalProviderManager: comlink.proxyValue(jsonRPCLocalProviderManager),
      })),
      30 * 1000,
    ),
  );
