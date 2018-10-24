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

export class FetchError extends Error {
  public constructor(public readonly url: string, public readonly status: number, public readonly statusText: string) {
    super(`Fetch for ${url} failed with status ${status}: ${statusText}`);
  }
}

export class FetchQueue {
  private readonly fetchConcurrency: number;
  // tslint:disable-next-line no-any
  private readonly mutableQueue: Array<QueueData<any>>;
  private mutableRunning: number;

  public constructor(options?: FetchQueueOptions) {
    this.fetchConcurrency = options === undefined ? 10 : options.fetchConcurrency;
    this.mutableQueue = [];
    this.mutableRunning = 0;
  }

  public async fetch<T>(url: string, handleResponse: (response: Response) => Promise<T>): Promise<T> {
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
          if (!res.ok) {
            throw new FetchError(entry.url, res.status, res.statusText);
          }

          const result = await entry.handleResponse(res);
          entry.resolve(result);
          this.mutableRunning -= 1;
          this.advance();
        })
        .catch((error) => {
          entry.reject(error);
          this.mutableRunning -= 1;
          this.advance();
        });
    }
  }
}
