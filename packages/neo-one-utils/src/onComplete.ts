import { Observable, Observer } from 'rxjs';

export function onComplete<T>(func: () => void): (source$: Observable<T>) => Observable<T> {
  return (source$) =>
    new Observable((observer: Observer<T>) =>
      source$.subscribe({
        next: (value) => observer.next(value),
        error: (error) => observer.error(error),
        complete: () => {
          // tslint:disable-next-line no-expression-statement
          func();
          // tslint:disable-next-line no-expression-statement
          observer.complete();
        },
      }),
    );
}
