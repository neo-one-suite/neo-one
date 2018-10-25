import { Builder, OutputMessage } from '@neo-one/local-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { Subject } from 'rxjs';
import { BuilderWorker } from './BuilderWorker';
import { DisposableEndpoint } from './types';

export const createBuilderManager = (
  dbID: string,
  getEndpoint: () => DisposableEndpoint,
  output$: Subject<OutputMessage>,
  // Don't accidentally include the json rpc worker in the build
  // tslint:disable-next-line no-any
  jsonRPCLocalProviderManager: WorkerManager<any>,
) =>
  comlink.proxyValue(
    new WorkerManager<typeof Builder>(
      BuilderWorker,
      () => {
        const disposableEndpoint = getEndpoint();
        const options = {
          dbID,
          endpoint: disposableEndpoint.endpoint,
          output$: comlink.proxyValue(output$),
          jsonRPCLocalProviderManager: comlink.proxyValue(jsonRPCLocalProviderManager),
        };

        return { options, disposables: [disposableEndpoint] };
      },
      300 * 1000,
    ),
  );
