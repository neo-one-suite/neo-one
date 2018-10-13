import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { Builder, BuilderWorker } from './build';
import { OutputMessage } from './types';

export const createBuilderManager = (
  output$: Subject<OutputMessage>,
  fileSystemID: string,
  provider: WorkerManager<typeof JSONRPCLocalProvider>,
) =>
  new WorkerManager<typeof Builder>(
    BuilderWorker,
    new BehaviorSubject({ output$: comlink.proxyValue(output$), fileSystemID, provider: comlink.proxyValue(provider) }),
    30 * 1000,
  );
