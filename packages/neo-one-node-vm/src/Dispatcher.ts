import * as nodePath from 'path';
import { ApplicationEngine, CreateOptions } from './ApplicationEngine';
import {
  BaseMethods,
  EngineMethods,
  ProtocolSettings,
  ProtocolSettingsReturn,
  SnapshotMethods,
  TestMethods,
} from './Methods';
import { SnapshotHandler } from './SnapshotHandler';
import { DispatcherFunc } from './types';
import { constants, createCSharpDispatchInvoke, validateProtocolSettings } from './utils';

export interface DispatcherMethods extends BaseMethods, SnapshotMethods, EngineMethods, TestMethods {}

const engineAssemblyOptions = {
  assemblyFile: nodePath.join(constants.CSHARP_APP_ROOT, 'Dispatcher.dll'),
  methodName: 'Invoke',
  typeName: 'NEOONE.Dispatcher',
};

export const createDispatcher = () => createCSharpDispatchInvoke<DispatcherMethods>(engineAssemblyOptions);

export interface DispatcherOptions {
  readonly levelDBPath?: string;
  readonly protocolSettings?: ProtocolSettings;
}

export class Dispatcher {
  public readonly init: boolean;
  public readonly dispatch: DispatcherFunc<DispatcherMethods>;
  public readonly options: DispatcherOptions;

  public constructor(options: DispatcherOptions = {}) {
    this.options = options;
    this.dispatch = createDispatcher();
    this.init = this.initialize(this.options.levelDBPath, this.options.protocolSettings);
  }

  public withSnapshots<T = void>(
    func: (snapshots: { readonly main: SnapshotHandler; readonly clone: Omit<SnapshotHandler, 'clone'> }) => T,
  ) {
    const main = new SnapshotHandler(this, 'main');
    const clone = new SnapshotHandler(this, 'clone');

    return func({ main, clone });
  }

  public withApplicationEngine<T = void>(
    options: CreateOptions,
    func: (engine: Omit<ApplicationEngine, 'create'>) => T,
  ) {
    const engine = new ApplicationEngine(this);
    engine.create(options);
    let result: T;
    try {
      result = func(engine);
    } catch (error) {
      throw error;
    } finally {
      this.disposeEngine();
    }

    return result;
  }

  public disposeEngine(): void {
    this.dispatch({
      method: 'dispose_engine',
    });
  }

  public updateSnapshots(): void {
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

  public getConfig(): ProtocolSettingsReturn {
    return this.dispatch({
      method: 'get_config',
    });
  }

  public updateStore(storage: ReadonlyArray<{ key: Buffer; value: Buffer }>): void {
    const tableChanges = storage.map((change) => ({
      table: change.key[0],
      key: change.key.slice(1),
      value: change.value,
    }));

    this.dispatch({
      method: 'test_update_store',
      args: {
        changes: tableChanges,
      },
    });
  }

  // tslint:disable-next-line: no-any
  public test(): any {
    return this.dispatch({
      method: 'test',
    });
  }

  private initialize(path?: string, settings?: ProtocolSettings): boolean {
    return this.dispatch({
      method: 'init',
      args: {
        path,
        settings: settings ? validateProtocolSettings(settings) : undefined,
      },
    });
  }
}
