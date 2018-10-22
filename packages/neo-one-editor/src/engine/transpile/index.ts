import { WorkerManager } from '@neo-one/worker';
import { Transpiler } from './Transpiler';
import { TranspilerWorker } from './TranspilerWorker';

export * from './transpile';
export * from './Transpiler';

// tslint:disable-next-line export-name
export const transpilerManager = new WorkerManager<typeof Transpiler>(
  TranspilerWorker,
  () => ({ options: {}, disposables: [] }),
  30 * 1000,
);
