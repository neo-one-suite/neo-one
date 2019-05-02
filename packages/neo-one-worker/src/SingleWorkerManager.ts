import * as comlink from './comlink';
import * as endpoint from './endpoint';
import { Disposable, WorkerConstructor, WorkerInstance, WorkerOptions } from './types';

function wrapEndpoint(endpointIn: endpoint.EndpointLike, onPostMessage: () => void): endpoint.WorkerEndpoint {
  const messageEndpoint = endpoint.getEndpoint(endpointIn);

  return {
    ...messageEndpoint,
    postMessage: (msg, transfer) => {
      onPostMessage();

      messageEndpoint.postMessage(msg, transfer);
    },
  };
}

export class SingleWorkerManager<T extends WorkerConstructor> {
  private readonly endpoint: endpoint.WorkerEndpoint;
  private readonly instance: Promise<WorkerInstance<T>>;
  private readonly idleCheckInterval: number;
  private mutableDisposed = false;
  private mutableLastUsedTime: number;
  private mutableInUse = 0;

  public constructor(
    endpointIn: endpoint.EndpointLike,
    options: WorkerOptions<T>,
    private readonly disposables: readonly Disposable[],
    private readonly idleTimeoutMS: number,
    private readonly onDispose: (value: SingleWorkerManager<T>) => void,
  ) {
    this.endpoint = wrapEndpoint(endpointIn, () => {
      this.mutableLastUsedTime = Date.now();
    });
    this.mutableLastUsedTime = 0;
    // tslint:disable-next-line no-any
    this.idleCheckInterval = setInterval(() => this.checkIfIdle(), 30 * 1000) as any;
    // tslint:disable-next-line no-any
    const WorkerClass = comlink.proxy(this.endpoint) as any;
    this.instance = Promise.resolve(options).then(async (opts) => new WorkerClass(opts));
  }

  public dispose(): void {
    if (!this.mutableDisposed) {
      this.mutableDisposed = true;
      clearInterval(this.idleCheckInterval);
      this.endpoint.close();
      this.disposables.forEach((disposable) => {
        disposable.dispose();
      });
      this.onDispose(this);
    }
  }

  public async withInstance<TResult>(func: (instance: WorkerInstance<T>) => Promise<TResult>): Promise<TResult>;
  public async withInstance<TResult>(func: (instance: WorkerInstance<T>) => TResult): Promise<TResult> {
    this.mutableInUse += 1;

    return this.getInstance()
      .then(func)
      .then((result) => {
        this.mutableInUse -= 1;

        return result;
      })
      .catch((error) => {
        this.mutableInUse -= 1;

        throw error;
      });
  }

  public async getInstance(): Promise<WorkerInstance<T>> {
    this.mutableLastUsedTime = Date.now();

    return this.instance;
  }

  private checkIfIdle(): void {
    if (this.mutableInUse > 0) {
      return;
    }

    const timePassedSinceLastUsed = Date.now() - this.mutableLastUsedTime;
    if (timePassedSinceLastUsed > this.idleTimeoutMS) {
      this.dispose();
    }
  }
}
