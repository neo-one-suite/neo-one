// tslint:disable promise-function-async
import { Disposable, WorkerMirrorFileSystem } from '@neo-one/local-browser';
import { LanguageServiceOptions } from './LanguageServiceOptions';
import { TypeScriptWorker } from './tsWorker';

import Promise = monaco.Promise;
import IDisposable = monaco.IDisposable;
import Uri = monaco.Uri;

type Clients = [monaco.editor.MonacoWebWorker<TypeScriptWorker>, TypeScriptWorker, Disposable];

// tslint:disable-next-line export-name
export class WorkerManager {
  private readonly modeID: string;
  private readonly options: LanguageServiceOptions;
  private readonly idleCheckInterval: NodeJS.Timer;
  private mutableLastUsedTime: number;
  private readonly configChangeListener: IDisposable;
  private mutableClients: Promise<Clients> | undefined;

  public constructor(modeID: string, options: LanguageServiceOptions) {
    this.modeID = modeID;
    this.options = options;
    this.idleCheckInterval = setInterval(() => this.checkIfIdle(), 30 * 1000);
    this.mutableLastUsedTime = 0;
    this.configChangeListener = this.options.onDidChange(() => this.stopWorker());
  }

  public dispose(): void {
    clearInterval(this.idleCheckInterval);
    this.configChangeListener.dispose();
    this.stopWorker();
  }

  // tslint:disable-next-line readonly-array
  public getScriptWorker(...resources: Uri[]): Promise<TypeScriptWorker> {
    return toShallowCancelPromise(this.getClients().then(([worker]) => worker.withSyncedResources(resources)));
  }

  public getWebWorker(): Promise<Worker> {
    // tslint:disable-next-line no-any
    return toShallowCancelPromise(this.getClients().then(([worker]) => (worker as any)._worker._worker.worker));
  }

  private stopWorker(): void {
    if (this.mutableClients) {
      // tslint:disable-next-line no-floating-promises
      this.mutableClients.then((value) => {
        value[0].dispose();
        value[2].dispose();
      });
      this.mutableClients = undefined;
    }
  }

  private checkIfIdle(): void {
    if (!this.mutableClients) {
      return;
    }
    const maxIdleTime = this.options.getWorkerMaxIdleTime();
    const timePassedSinceLastUsed = Date.now() - this.mutableLastUsedTime;
    if (maxIdleTime > 0 && timePassedSinceLastUsed > maxIdleTime) {
      this.stopWorker();
    }
  }

  private getClients(): Promise<Clients> {
    this.mutableLastUsedTime = Date.now();

    if (this.mutableClients === undefined) {
      const worker = monaco.editor.createWebWorker<TypeScriptWorker>({
        moduleId: 'unused',
        label: this.modeID,
        createData: {
          compilerOptions: this.options.getCompilerOptions(),
          isSmartContract: this.options.isSmartContract(),
          fileSystemID: this.options.getFileSystemID(),
        },
      });

      let p = worker.getProxy();

      if (this.options.getEagerModelSync()) {
        p = p.then(() =>
          worker.withSyncedResources(
            monaco.editor
              .getModels()
              .filter((model) => model.getModeId() === this.modeID)
              .map((model) => model.uri),
          ),
        );
      }

      this.mutableClients = p.then<Clients>((client) => {
        // tslint:disable-next-line no-any
        const webWorker = (worker as any)._worker._worker.worker;
        const disposable = WorkerMirrorFileSystem.subscribe(this.options.getFileSystem(), webWorker);

        return [worker, client, disposable];
      });
    }

    return this.mutableClients;
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
