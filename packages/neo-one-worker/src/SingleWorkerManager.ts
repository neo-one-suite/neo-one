import * as comlink from './comlink';
import { Disposable, EndpointLike, WorkerConstructor, WorkerInstance, WorkerOptions } from './types';

interface WorkerEndpoint extends comlink.Endpoint {
  readonly close: () => void;
}

function isWindow(endpoint: EndpointLike): endpoint is Window {
  return ['window', 'length', 'location', 'parent', 'opener'].every((prop) => prop in endpoint);
}

function isWorker(endpoint: EndpointLike): endpoint is Worker {
  return ['onmessage', 'postMessage', 'terminate', 'addEventListener', 'removeEventListener'].every(
    (prop) => prop in endpoint,
  );
}

function windowEndpoint(w: Window): WorkerEndpoint {
  if (self.constructor.name !== 'Window') {
    throw Error('self is not a window');
  }

  return {
    addEventListener: self.addEventListener.bind(self),
    removeEventListener: self.removeEventListener.bind(self),
    postMessage: (msg, transfer) => w.postMessage(msg, '*', transfer),
    close: () => {
      // do nothing
    },
  };
}

function workerEndpoint(worker: Worker): WorkerEndpoint {
  return {
    addEventListener: worker.addEventListener.bind(worker),
    removeEventListener: worker.removeEventListener.bind(worker),
    postMessage: worker.postMessage.bind(worker),
    close: worker.terminate.bind(worker),
  };
}

function endpointEndpoint(endpoint: comlink.Endpoint): WorkerEndpoint {
  return {
    addEventListener: endpoint.addEventListener.bind(endpoint),
    removeEventListener: endpoint.removeEventListener.bind(endpoint),
    postMessage: endpoint.postMessage.bind(endpoint),
    close: () => {
      // do nothing
    },
  };
}

function getEndpoint(endpointIn: EndpointLike, onPostMessage: () => void): WorkerEndpoint {
  const endpoint = isWindow(endpointIn)
    ? windowEndpoint(endpointIn)
    : isWorker(endpointIn)
      ? workerEndpoint(endpointIn)
      : endpointEndpoint(endpointIn);

  return {
    ...endpoint,
    postMessage: (msg, transfer) => {
      onPostMessage();

      endpoint.postMessage(msg, transfer);
    },
  };
}

export class SingleWorkerManager<T extends WorkerConstructor> {
  private readonly endpoint: WorkerEndpoint;
  private readonly instance: Promise<WorkerInstance<T>>;
  private readonly idleCheckInterval: NodeJS.Timer;
  private mutableDisposed = false;
  private mutableLastUsedTime: number;
  private mutableInUse = 0;

  public constructor(
    endpoint: EndpointLike,
    options: WorkerOptions<T>,
    private readonly disposables: ReadonlyArray<Disposable>,
    private readonly idleTimeoutMS: number,
    private readonly onDispose: (value: SingleWorkerManager<T>) => void,
  ) {
    this.endpoint = getEndpoint(endpoint, () => {
      this.mutableLastUsedTime = Date.now();
    });
    this.mutableLastUsedTime = 0;
    this.idleCheckInterval = setInterval(() => this.checkIfIdle(), 30 * 1000);
    // tslint:disable-next-line no-any
    const WorkerClass = comlink.proxy(this.endpoint) as any;
    this.instance = Promise.resolve(options).then((opts) => new WorkerClass(opts));
  }

  public dispose(): void {
    if (!this.mutableDisposed) {
      this.mutableDisposed = true;
      clearInterval(this.idleCheckInterval);
      this.endpoint.close();
      this.disposables.forEach(({ dispose }) => {
        dispose();
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
