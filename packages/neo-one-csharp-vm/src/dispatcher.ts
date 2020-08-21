import path from 'path';
import { ApplicationEngine, CreateOptions } from './ApplicationEngine';
import { BaseMethods, EngineMethods, SnapshotMethods } from './Methods';
import { SnapshotHandler } from './SnapshotHandler';
import { DispatcherFunc } from './types';
import { constants, createCSharpDispatchInvoke } from './utils';

export interface DispatcherMethods extends BaseMethods, SnapshotMethods, EngineMethods {}

const engineAssemblyOptions = {
  assemblyFile: path.join(constants.CSHARP_APP_ROOT, 'Dispatcher.dll'),
  methodName: 'Invoke',
  typeName: 'NEOONE.Dispatcher',
};

export const createDispatcher = () => createCSharpDispatchInvoke<DispatcherMethods>(engineAssemblyOptions);

export class Dispatcher {
  public readonly init: boolean;
  public readonly dispatch: DispatcherFunc<DispatcherMethods>;

  public constructor() {
    this.dispatch = createDispatcher();
    this.init = this.initialize();
  }

  public withSnapshots<T>(
    func: (snapshots: { readonly main: SnapshotHandler; readonly clone: Omit<SnapshotHandler, 'clone'> }) => T,
  ) {
    const main = new SnapshotHandler(this, 'main');
    const clone = new SnapshotHandler(this, 'clone');

    const result = func({ main, clone });
    this.resetSnapshots();

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
    this.initialize();
  }

  private initialize(): boolean {
    return this.dispatch({
      method: 'init',
    });
  }
}
