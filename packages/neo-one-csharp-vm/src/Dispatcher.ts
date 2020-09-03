import * as nodePath from 'path';
import { ApplicationEngine, CreateOptions } from './ApplicationEngine';
import { BaseMethods, EngineMethods, SnapshotMethods } from './Methods';
import { SnapshotHandler } from './SnapshotHandler';
import { DispatcherFunc } from './types';
import { constants, createCSharpDispatchInvoke } from './utils';

export interface DispatcherMethods extends BaseMethods, SnapshotMethods, EngineMethods {}

const engineAssemblyOptions = {
  assemblyFile: nodePath.join(constants.CSHARP_APP_ROOT, 'Dispatcher.dll'),
  methodName: 'Invoke',
  typeName: 'NEOONE.Dispatcher',
};

export const createDispatcher = () => createCSharpDispatchInvoke<DispatcherMethods>(engineAssemblyOptions);

export interface DispatcherOptions {
  readonly levelDBPath?: string;
}

export class Dispatcher {
  public readonly init: boolean;
  public readonly dispatch: DispatcherFunc<DispatcherMethods>;
  public readonly options: DispatcherOptions;

  public constructor(options: DispatcherOptions = {}) {
    this.options = options;
    this.dispatch = createDispatcher();
    this.init = this.initialize(this.options.levelDBPath);
  }

  public withSnapshots<T>(
    func: (snapshots: { readonly main: SnapshotHandler; readonly clone: Omit<SnapshotHandler, 'clone'> }) => T,
  ) {
    this.resetSnapshots();
    const main = new SnapshotHandler(this, 'main');
    const clone = new SnapshotHandler(this, 'clone');

    const result = func({ main, clone });

    return result;
  }

  public withApplicationEngine<T>(options: CreateOptions, func: (engine: Omit<ApplicationEngine, 'create'>) => T) {
    const engine = new ApplicationEngine(this);
    engine.create(options);
    const result = func(engine);
    this.disposeEngine();

    return result;
  }

  public disposeEngine(): void {
    this.dispatch({
      method: 'dispose_engine',
    });
  }

  public resetSnapshots(): void {
    this.dispatch({
      method: 'snapshot_reset',
    });
  }

  public dispose(): void {
    this.dispatch({
      method: 'dispose',
    });
  }

  public reset(): void {
    this.dispose();
    this.initialize(this.options.levelDBPath);
  }

  private initialize(path?: string): boolean {
    return this.dispatch({
      method: 'init',
      args: {
        path,
      },
    });
  }
}
