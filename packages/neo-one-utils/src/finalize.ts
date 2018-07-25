import { Observable, Observer } from 'rxjs';
import { utils } from './utils';

// tslint:disable-next-line no-let
let currentID = 0;
const getID = () => {
  const result = currentID;
  currentID += 1;

  return result;
};

export function finalize<T>(
  func: (value: T | undefined) => Promise<void> | void,
): (source$: Observable<T>) => Observable<T> {
  return (source$) =>
    Observable.create((observer: Observer<T>) => {
      let lastValue: T | undefined;
      const subscription = source$.subscribe({
        next: (value) => {
          lastValue = value;
          observer.next(value);
        },
        error: (error) => observer.error(error),
        complete: () => observer.complete(),
      });
      subscription.add(() => {
        const result = func(lastValue);
        if (utils.isPromise(result)) {
          const id = getID();
          let deleted = false;
          const promise = result.then(() => {
            deleted = true;
            finalize.shutdownPromises.delete(id);
          });
          if (!deleted) {
            finalize.shutdownPromises.set(id, promise);
          }
        }
      });

      return subscription;
    }) as Observable<T>;
}

export namespace finalize {
  export const shutdownPromises = new Map<number, Promise<void>>();
  export const wait = async () => {
    const promises = [...shutdownPromises.values()];
    shutdownPromises.clear();
    if (promises.length === 0) {
      return;
    }

    await Promise.all(promises);
    await wait();
  };
}
