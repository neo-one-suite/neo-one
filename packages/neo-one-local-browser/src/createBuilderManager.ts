import { comlink, WorkerManager } from '@neo-one/worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { Builder, BuilderWorker } from './build';
import { jsonRPCLocalProviderManager } from './jsonRPCLocalProviderManager';
import { OutputMessage } from './types';

export const createBuilderManager = (output$: Subject<OutputMessage>, fileSystemID: string) =>
  new WorkerManager<typeof Builder>(
    BuilderWorker,
    new BehaviorSubject({ output$: comlink.proxyValue(output$), fileSystemID, provider: jsonRPCLocalProviderManager }),
  );
