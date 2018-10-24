import { Observable, Subscription } from 'rxjs';
import { EndpointLike } from './endpoint';
import { SingleWorkerManager } from './SingleWorkerManager';
import { Disposable, WorkerConstructor, WorkerInstance, WorkerOptions } from './types';

export class WorkerManager<T extends WorkerConstructor> {
  public readonly instance$: Observable<WorkerInstance<T>>;
  private readonly subscription: Subscription | undefined;
  private readonly mutableDisposables: Disposable[] = [];
  private mutableWorkerManager: SingleWorkerManager<T> | undefined;

  public constructor(
    private readonly createEndpoint: () => EndpointLike,
    private readonly getOptions: () => {
      readonly options: WorkerOptions<T>;
      readonly disposables: ReadonlyArray<Disposable>;
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

    if (forceRestart$ !== undefined) {
      // tslint:disable-next-line rxjs-no-ignored-error
      this.subscription = forceRestart$.subscribe(() => {
        this.stopWorker();
      });
    }
  }

  public dispose(): void {
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
    this.mutableDisposables.forEach((disposable) => {
      disposable.dispose();
    });
    this.stopWorker();
  }

  public add(disposable: Disposable): void {
    this.mutableDisposables.push(disposable);
  }

  public async withInstance<TResult>(func: (instance: WorkerInstance<T>) => Promise<TResult>): Promise<TResult>;
  public async withInstance<TResult>(func: (instance: WorkerInstance<T>) => TResult): Promise<TResult> {
    // tslint:disable-next-line no-any
    return this.getSingleWorkerManager().withInstance(func as any);
  }

  public async getInstance(): Promise<WorkerInstance<T>> {
    return this.getSingleWorkerManager().getInstance();
  }

  private readonly stopWorker = () => {
    if (this.mutableWorkerManager !== undefined) {
      this.mutableWorkerManager.dispose();
      this.mutableWorkerManager = undefined;
    }
  };

  private getSingleWorkerManager(): SingleWorkerManager<T> {
    if (this.mutableWorkerManager === undefined) {
      const endpoint = this.createEndpoint();
      const { options, disposables } = this.getOptions();
      this.mutableWorkerManager = new SingleWorkerManager(
        endpoint,
        options,
        disposables,
        this.idleTimeoutMS,
        (manager) => {
          if (this.mutableWorkerManager === manager) {
            this.mutableWorkerManager = undefined;
          }
        },
      );
    }

    return this.mutableWorkerManager;
  }
}
