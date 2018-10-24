import fetch from 'cross-fetch';

interface QueueData<T> {
  readonly url: string;
  readonly handleResponse: (response: Response) => Promise<T>;
  readonly resolve: (result: T) => void;
  readonly reject: (error: Error) => void;
}

interface FetchQueueOptions {
  readonly fetchConcurrency: number;
}

export class FetchQueue<T> {
  private readonly fetchConcurrency: number;
  private readonly mutableQueue: Array<QueueData<T>>;
  private mutableRunning: number;

  public constructor(options?: FetchQueueOptions) {
    this.fetchConcurrency = options === undefined ? 10 : options.fetchConcurrency;
    this.mutableQueue = [];
    this.mutableRunning = 0;
  }

  public async fetch(url: string, handleResponse: (response: Response) => Promise<T>): Promise<T> {
    // tslint:disable-next-line:promise-must-complete
    const tPromise = new Promise<T>((resolve, reject) => {
      this.mutableQueue.push({
        url,
        handleResponse,
        resolve,
        reject,
      });
    });
    this.advance();

    return tPromise;
  }

  private advance() {
    if (this.mutableRunning >= this.fetchConcurrency) {
      return;
    }

    const entry = this.mutableQueue.shift();
    if (entry !== undefined) {
      this.mutableRunning += 1;
      fetch(entry.url)
        .then(async (res) => {
          const result = await entry.handleResponse(res);
          entry.resolve(result);
          this.mutableRunning -= 1;
          this.advance();
        })
        .catch(entry.reject);
    }
  }
}
