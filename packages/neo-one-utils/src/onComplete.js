/* @flow */
import { Observable } from 'rxjs/Observable';

function onComplete<T>(
  func: () => void,
): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) =>
    Observable.create(observer =>
      source.subscribe({
        next: value => observer.next(value),
        error: error => observer.error(error),
        complete: () => {
          func();
          observer.complete();
        },
      }),
    );
}

export default onComplete;
