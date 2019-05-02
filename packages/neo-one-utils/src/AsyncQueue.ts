interface QueueData<T> {
  readonly key: string;
  readonly execute: () => Promise<T>;
  readonly resolve: (result: T) => void;
  readonly reject: (error: Error) => void;
}

interface AsyncQueueOptions {
  readonly concurrency?: number;
}

export class AsyncQueue {
  private readonly concurrency: number;
  // tslint:disable-next-line no-any
  private readonly mutableQueue: QueueData<any>[] = [];
  // tslint:disable-next-line no-any
  private readonly inflight: Map<string, Promise<any>> = new Map();
  private mutableRunning = 0;

  public constructor({ concurrency = 10 }: AsyncQueueOptions = {}) {
    this.concurrency = concurrency;
  }

  public async execute<T>(key: string, execute: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing !== undefined) {
      return existing;
    }

    // tslint:disable-next-line:promise-must-complete
    const promise = new Promise<T>((resolve, reject) => {
      this.mutableQueue.push({
        key,
        execute,
        resolve,
        reject,
      });
    });
    this.inflight.set(key, promise);
    this.advance();

    return promise;
  }

  private advance() {
    if (this.mutableRunning >= this.concurrency) {
      return;
    }

    const entry = this.mutableQueue.shift();
    if (entry !== undefined) {
      const next = () => {
        this.inflight.delete(entry.key);
        this.mutableRunning -= 1;
        this.advance();
      };

      this.mutableRunning += 1;
      entry
        .execute()
        .then(async (result) => {
          entry.resolve(result);
          next();
        })
        .catch((error) => {
          entry.reject(error);
          next();
        });
    }
  }
}
