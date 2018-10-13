import { WorkerManager } from '@neo-one/worker';
import { BehaviorSubject } from 'rxjs';
import { Transpiler } from './Transpiler';
import { TranspilerWorker } from './TranspilerWorker';

export * from './transpile';
export * from './Transpiler';
export * from './TranspiledModule';

// tslint:disable-next-line export-name
export const transpiler = new WorkerManager<typeof Transpiler>(
  TranspilerWorker,
  new BehaviorSubject<{}>({}),
  30 * 1000,
);
