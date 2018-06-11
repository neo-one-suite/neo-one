/* @flow */
import { Observable, Observer } from 'rxjs';

let currentID = 0;
const getID = () => {
  const result = currentID;
  currentID += 1;
  return result;
};

export function finalize<T>(
  func: (value: T | undefined) => Promise<void> | void,
): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) =>
    Observable.create((observer: Observer<T>) => {
      let lastValue: T | undefined;
      const subscription = source.subscribe({
        next: (value) => {
          lastValue = value;
          observer.next(value);
        },
        error: (error) => observer.error(error),
        complete: () => observer.complete(),
      });
      subscription.add(() => {
        const result = func(lastValue);
        if (result != null && result.then != null) {
          const id = getID();
          let deleted = false;
          const promise = result.then(() => {
            deleted = true;
            if (finalize.shutdownPromises[id] != null) {
              delete finalize.shutdownPromises[id];
            }
          });
          if (!deleted) {
            finalize.shutdownPromises[id] = promise;
          }
        }
      });
      return subscription;
    });
}
(finalize as any).shutdownPromises = {};
(finalize as any).wait = async () => {
  const promises = Object.values(finalize.shutdownPromises);
  if (promises.length === 0) {
    return;
  }

  await Promise.all(promises);
  await finalize.wait();
};

export declare namespace finalize {
  export const shutdownPromises: { [key: string]: Promise<void> };
  export const wait: () => Promise<void>;
}
