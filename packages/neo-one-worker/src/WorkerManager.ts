import { Observable, Subscription } from 'rxjs';
import { EndpointLike } from './endpoint';
import { SingleWorkerManager } from './SingleWorkerManager';
import { Disposable, WorkerConstructor, WorkerInstance, WorkerOptions } from './types';

export class WorkerManager<T extends WorkerConstructor> {
  public readonly instance$: Observable<WorkerInstance<T>>;
  private readonly subscription: Subscription | undefined;
  private readonly mutableDisposables: Disposable[] = [];
  private mutableWorkerManagerPromise: Promise<SingleWorkerManager<T>> | undefined;
  private mutableWorkerManager: SingleWorkerManager<T> | undefined;
  private mutableDisposed = false;

  public constructor(
    private readonly createEndpoint: () => Promise<EndpointLike> | EndpointLike,
    private readonly getOptions: () => {
      readonly options: WorkerOptions<T>;
      readonly disposables: readonly Disposable[];
    },
    private readonly idleTimeoutMS: number,
    forceRestart$?: Observable<void>,
  ) {
    this.instance$ = new Observable<WorkerInstance<T>>((observer) => {
      let resolver: (() => void) | undefined;
      let cancelled = false;
      this.withInstance(
        async (instance) =>
          // tslint:disable-next-line:promise-must-complete
          new Promise<void>((resolve) => {
            if (cancelled) {
              resolve();
            } else {
              resolver = resolve;
              observer.next(instance);
            }
          }),
      ).catch((error) => {
        observer.error(error);
      });

      return () => {
        cancelled = true;
        if (resolver !== undefined) {
          resolver();
        }
      };
    });

    this.eagerStart();
    if (forceRestart$ !== undefined) {
      // tslint:disable-next-line rxjs-no-ignored-error
      this.subscription = forceRestart$.subscribe(() => {
        this.stopWorker();
        this.eagerStart();
      });
    }
  }

  public dispose(): void {
    if (!this.mutableDisposed) {
      this.mutableDisposed = true;
      if (this.subscription !== undefined) {
        this.subscription.unsubscribe();
      }
      this.mutableDisposables.forEach((disposable) => {
        disposable.dispose();
      });
      this.stopWorker();
      if (this.mutableWorkerManagerPromise !== undefined) {
        this.mutableWorkerManagerPromise
          .then((manager) => {
            manager.dispose();
            this.mutableWorkerManagerPromise = undefined;
          })
          .catch((error) => {
            // tslint:disable-next-line no-console
            console.error(error);
          });
      }
    }
  }

  public add(disposable: Disposable): void {
    this.mutableDisposables.push(disposable);
  }

  public async withInstance<TResult>(func: (instance: WorkerInstance<T>) => Promise<TResult>): Promise<TResult>;
  public async withInstance<TResult>(func: (instance: WorkerInstance<T>) => TResult): Promise<TResult> {
    const manager = await this.getSingleWorkerManager();

    // tslint:disable-next-line no-any
    return manager.withInstance(func as any);
  }

  public async getInstance(): Promise<WorkerInstance<T>> {
    const manager = await this.getSingleWorkerManager();

    return manager.getInstance();
  }

  private eagerStart(): void {
    this.getInstance().catch((error) => {
      // tslint:disable-next-line no-console
      console.error(error);
    });
  }

  private readonly stopWorker = () => {
    if (this.mutableWorkerManager !== undefined) {
      this.mutableWorkerManager.dispose();
      this.mutableWorkerManagerPromise = undefined;
      this.mutableWorkerManager = undefined;
    }
  };

  private async getSingleWorkerManager(): Promise<SingleWorkerManager<T>> {
    if (this.mutableDisposed) {
      throw new Error('WorkerManager was already disposed');
    }

    if (this.mutableWorkerManagerPromise === undefined) {
      this.mutableWorkerManagerPromise = Promise.resolve(this.createEndpoint()).then((endpoint) => {
        const { options, disposables } = this.getOptions();
        this.mutableWorkerManager = new SingleWorkerManager(
          endpoint,
          options,
          disposables,
          this.idleTimeoutMS,
          (manager) => {
            if (this.mutableWorkerManager === manager) {
              this.mutableWorkerManagerPromise = undefined;
              this.mutableWorkerManager = undefined;
            }
          },
        );

        return this.mutableWorkerManager;
      });
    }

    return this.mutableWorkerManagerPromise;
  }
}
