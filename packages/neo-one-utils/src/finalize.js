/* @flow */
import { Observable } from 'rxjs/Observable';

import uuidV4 from 'uuid/v4';

function finalize<T>(
  func: (value: ?T) => Promise<void> | void,
): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) =>
    Observable.create(observer => {
      let lastValue;
      const subscription = source.subscribe({
        next: value => {
          lastValue = value;
          observer.next(value);
        },
        error: error => observer.error(error),
        complete: () => observer.complete(),
      });
      subscription.add(() => {
        const result = func(lastValue);
        if (result != null && result.then != null) {
          const id = uuidV4();
          let deleted = false;
          const promise = result.then(() => {
            deleted = true;
            if (finalize._shutdownPromises[id] != null) {
              delete finalize._shutdownPromises[id];
            }
          });
          if (!deleted) {
            finalize._shutdownPromises[id] = promise;
          }
        }
      });
      return subscription;
    });
}
finalize._shutdownPromises = {};
finalize.wait = async () => {
  const shutdownPromises = Object.values(finalize._shutdownPromises);
  if (shutdownPromises.length === 0) {
    return;
  }

  await Promise.all(shutdownPromises);
  await finalize.wait();
};

export default finalize;
