/* @flow */
import { Observable } from 'rxjs/Observable';

export default function neverComplete<T>(): (
  source: Observable<T>,
) => Observable<T> {
  return (source: Observable<T>) =>
    Observable.create(observer =>
      source.subscribe({
        next: value => observer.next(value),
        error: error => observer.error(error),
        complete: () => {},
      }),
    );
}
