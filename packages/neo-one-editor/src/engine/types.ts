import { Builder } from '@neo-one/local-browser';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { WorkerManager } from '@neo-one/worker';
import { Transpiler } from './transpile';

// tslint:disable-next-line no-any
export type Exports = any;

export interface RegisterPreviewEngineResult {
  readonly id: string;
  readonly builderManager: WorkerManager<typeof Builder>;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  readonly transpiler: WorkerManager<typeof Transpiler>;
}
