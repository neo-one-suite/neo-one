import { Observable, Observer } from 'rxjs';

export function neverComplete<T>(): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) =>
    Observable.create((observer: Observer<T>) =>
      source.subscribe({
        next: (value) => observer.next(value),
        error: (error) => observer.error(error),
        complete: () => {
          // do nothing
        },
      }),
    );
}
