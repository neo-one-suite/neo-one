import { Event } from './types';
type Item = { readonly type: 'value'; readonly value: Event } | { readonly type: 'error'; readonly error: Error };
interface Resolver {
  readonly resolve: (value: IteratorResult<Event>) => void;
  readonly reject: (reason: Error) => void;
}

export class ConsensusQueue implements AsyncIterator<Event> {
  private mutableItems: Item[];
  private mutableResolvers: Resolver[];
  private mutableDoneInternal: boolean;

  public constructor() {
    this.mutableItems = [];
    this.mutableResolvers = [];
    this.mutableDoneInternal = false;
  }

  public [Symbol.asyncIterator]() {
    return this;
  }

  public async next(): Promise<IteratorResult<Event>> {
    const item = this.mutableItems.shift();
    if (item !== undefined) {
      if (item.type === 'error') {
        return Promise.reject(item.error);
      }

      return Promise.resolve({ done: false, value: item.value });
    }

    if (this.mutableDoneInternal) {
      // tslint:disable-next-line no-any
      return Promise.resolve({ done: true } as any);
    }

    // tslint:disable-next-line promise-must-complete
    return new Promise<IteratorResult<Event>>((resolve, reject) => {
      this.mutableResolvers.push({ resolve, reject });
    });
  }

  public write(value: Event): void {
    this.push({ type: 'value', value });
  }

  public error(error: Error): void {
    this.push({ type: 'error', error });
  }

  public clear(): void {
    this.mutableItems = [];
  }

  public done(): void {
    this.clear();
    // tslint:disable-next-line no-any
    this.mutableResolvers.forEach(({ resolve }) => resolve({ done: true } as any));
    this.mutableResolvers = [];
    this.mutableDoneInternal = true;
  }

  private push(item: Item): void {
    if (this.mutableDoneInternal) {
      throw new Error('ConsensusQueue already ended');
    }

    const resolver = this.mutableResolvers.shift();
    if (resolver !== undefined) {
      const { resolve, reject } = resolver;
      if (item.type === 'error') {
        reject(item.error);
      } else {
        resolve({ done: false, value: item.value });
      }
    } else {
      this.mutableItems.push(item);
    }
  }
}
