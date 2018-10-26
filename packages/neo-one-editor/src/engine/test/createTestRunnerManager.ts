import { Builder } from '@neo-one/local-browser';
import { DisposableEndpoint } from '@neo-one/local-browser-worker';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { TestRunnerCallbacks } from '../../types';
import { TestRunner } from './TestRunner';
import { TestRunnerWorker } from './TestRunnerWorker';

export const createTestRunnerManager = (
  id: string,
  getEndpoint: () => DisposableEndpoint,
  builderManager: WorkerManager<typeof Builder>,
  jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>,
  callbacks: TestRunnerCallbacks,
) =>
  comlink.proxyValue(
    new WorkerManager<typeof TestRunner>(
      TestRunnerWorker,
      () => {
        const disposableEndpoint = getEndpoint();
        const options = {
          id,
          endpoint: disposableEndpoint.endpoint,
          builderManager: comlink.proxyValue(builderManager),
          jsonRPCLocalProviderManager: comlink.proxyValue(jsonRPCLocalProviderManager),
          callbacks: { ...callbacks },
        };

        return { options, disposables: [disposableEndpoint] };
      },
      300 * 1000,
    ),
  );
