import { Builder } from '@neo-one/local-browser';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { TextRange } from '../../editor';

export interface RegisterPreviewEngineResult {
  readonly id: string;
  readonly endpoint: comlink.Endpoint;
  readonly builderManager: WorkerManager<typeof Builder>;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  readonly openFile: (path: string, range?: TextRange) => void;
}
