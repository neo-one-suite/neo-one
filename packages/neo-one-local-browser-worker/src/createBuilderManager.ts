import { Builder, OutputMessage } from '@neo-one/local-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { BuilderWorker } from './BuilderWorker';

export const createBuilderManager = (
  dbID: string,
  endpoint: () => comlink.Endpoint,
  output$: Subject<OutputMessage>,
  // Don't accidentally include the json rpc worker in the build
  // tslint:disable-next-line no-any
  jsonRPCLocalProviderManager: WorkerManager<any>,
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
