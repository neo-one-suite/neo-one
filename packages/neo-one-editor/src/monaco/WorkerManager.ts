// tslint:disable promise-function-async
import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import { TypeScriptWorker } from './tsWorker';

import Promise = monaco.Promise;
import IDisposable = monaco.IDisposable;
import Uri = monaco.Uri;

// tslint:disable-next-line export-name
export class WorkerManager {
  private readonly modeID: string;
  private readonly defaults: LanguageServiceDefaultsImpl;
  private readonly idleCheckInterval: NodeJS.Timer;
  private mutableLastUsedTime: number;
  private readonly configChangeListener: IDisposable;
  private mutableWorker: monaco.editor.MonacoWebWorker<TypeScriptWorker> | undefined;
  private mutableClient: Promise<TypeScriptWorker> | undefined;

  public constructor(modeID: string, defaults: LanguageServiceDefaultsImpl) {
    this.modeID = modeID;
    this.defaults = defaults;
    this.idleCheckInterval = setInterval(() => this.checkIfIdle(), 30 * 1000);
    this.mutableLastUsedTime = 0;
    this.configChangeListener = this.defaults.onDidChange(() => this.stopWorker());
  }

  public dispose(): void {
    clearInterval(this.idleCheckInterval);
    this.configChangeListener.dispose();
    this.stopWorker();
  }

  // tslint:disable-next-line readonly-array
  public getLanguageServiceWorker(...resources: Uri[]): Promise<TypeScriptWorker> {
    let mutableClient: TypeScriptWorker;

    return toShallowCancelPromise(
      this.getClient()
        .then((client) => {
          mutableClient = client;
        })
        .then(() => {
          if (this.mutableWorker === undefined) {
            throw new Error('Something went wrong');
          }

          return this.mutableWorker.withSyncedResources(resources);
        })
        .then(() => mutableClient),
    );
  }

  private stopWorker(): void {
    if (this.mutableWorker) {
      this.mutableWorker.dispose();
      this.mutableWorker = undefined;
    }
    this.mutableClient = undefined;
  }

  private checkIfIdle(): void {
    if (!this.mutableWorker) {
      return;
    }
    const maxIdleTime = this.defaults.getWorkerMaxIdleTime();
    const timePassedSinceLastUsed = Date.now() - this.mutableLastUsedTime;
    if (maxIdleTime > 0 && timePassedSinceLastUsed > maxIdleTime) {
      this.stopWorker();
    }
  }

  private getClient(): Promise<TypeScriptWorker> {
    this.mutableLastUsedTime = Date.now();

    if (this.mutableClient === undefined) {
      this.mutableWorker = monaco.editor.createWebWorker<TypeScriptWorker>({
        moduleId: 'unused',
        label: this.modeID,
        createData: {
          compilerOptions: this.defaults.getCompilerOptions(),
          extraLibs: this.defaults.getExtraLibs(),
          isSmartContract: this.defaults.isSmartContract(),
        },
      });

      let p = this.mutableWorker.getProxy();
      const worker = this.mutableWorker;

      if (this.defaults.getEagerModelSync()) {
        p = p.then(() =>
          worker.withSyncedResources(
            monaco.editor
              .getModels()
              .filter((model) => model.getModeId() === this.modeID)
              .map((model) => model.uri),
          ),
        );
      }

      this.mutableClient = p;
    }

    return this.mutableClient;
  }
}

function toShallowCancelPromise<T>(p: Promise<T>): Promise<T> {
  let completeCallback: (value: T) => void;
  let errorCallback: (err: Error) => void;

  // tslint:disable-next-line promise-must-complete
  const r = new Promise<T>(
    (c, e) => {
      completeCallback = c;
      errorCallback = e;
    },
    () => {
      // do nothing
    },
  );

  // @ts-ignore
  p.then(completeCallback, errorCallback);

  return r;
}
