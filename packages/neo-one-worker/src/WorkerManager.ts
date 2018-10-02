import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import * as comlink from './comlink';
import { setup } from './setup';

interface WorkerEndpoint extends comlink.Endpoint {
  readonly close: () => void;
}

// tslint:disable-next-line no-any
type WorkerConstructor = new (options: any) => any;
// tslint:disable-next-line no-any no-unused
type WorkerInstance<T> = T extends new (options: any) => infer TInstance ? TInstance : never;
// tslint:disable-next-line no-any no-unused
type WorkerOptions<T> = T extends new (options: infer TOptions) => any ? TOptions : never;

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

type EndpointLike = comlink.Endpoint | Window | Worker;
type CreateEndpointBase = () => EndpointLike;

function wrapCreateEndpoint(createEndpoint: CreateEndpointBase, onPostMessage: () => void): () => WorkerEndpoint {
  return () => getEndpoint(createEndpoint(), onPostMessage);
}

export class WorkerManager<T extends WorkerConstructor> {
  private readonly subscription: Subscription;
  private readonly createEndpoint: () => WorkerEndpoint;
  private mutableOptions: WorkerOptions<T> | undefined;
  private mutableEndpoint: WorkerEndpoint | undefined;
  private mutableInstance: Promise<WorkerInstance<T>> | undefined;
  private mutableLastUsedTime: number;
  private readonly idleCheckInterval: NodeJS.Timer;

  public constructor(
    createEndpoint: () => EndpointLike,
    private readonly options$: Observable<WorkerOptions<T>>,
    private readonly idleTimeoutMS?: number,
  ) {
    setup();
    this.createEndpoint = wrapCreateEndpoint(createEndpoint, () => {
      this.mutableLastUsedTime = Date.now();
    });
    this.subscription = options$.subscribe({
      next: (options) => {
        this.mutableOptions = options;
        this.stopWorker();
      },
    });
    this.mutableLastUsedTime = 0;
    this.idleCheckInterval = setInterval(() => this.checkIfIdle(), 30 * 1000);
  }

  public dispose(): void {
    clearInterval(this.idleCheckInterval);
    this.subscription.unsubscribe();
    this.stopWorker();
  }

  public async getInstance(): Promise<WorkerInstance<T>> {
    if (this.mutableInstance === undefined) {
      this.mutableEndpoint = this.createEndpoint();
      // tslint:disable-next-line no-any
      const WorkerClass = comlink.proxy(this.mutableEndpoint) as any;
      this.mutableInstance = this.getOptions().then((options) => new WorkerClass(options));
    }

    return this.mutableInstance;
  }

  private checkIfIdle(): void {
    if (this.mutableEndpoint === undefined) {
      return;
    }

    const timePassedSinceLastUsed = Date.now() - this.mutableLastUsedTime;
    if (this.idleTimeoutMS !== undefined && timePassedSinceLastUsed > this.idleTimeoutMS) {
      this.stopWorker();
    }
  }

  private readonly stopWorker = () => {
    if (this.mutableEndpoint !== undefined) {
      this.mutableEndpoint.close();
      this.mutableInstance = undefined;
      this.mutableEndpoint = undefined;
    }
  };

  private async getOptions(): Promise<WorkerOptions<T>> {
    if (this.mutableOptions === undefined) {
      return this.options$.pipe(take(1)).toPromise();
    }

    return this.mutableOptions;
  }
}
