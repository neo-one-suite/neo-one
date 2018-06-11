import { Observable, Observer } from 'rxjs';

export function onComplete<T>(
  func: () => void,
): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) =>
    Observable.create((observer: Observer<T>) =>
      source.subscribe({
        next: (value) => observer.next(value),
        error: (error) => observer.error(error),
        complete: () => {
          func();
          observer.complete();
        },
      }),
    );
}
