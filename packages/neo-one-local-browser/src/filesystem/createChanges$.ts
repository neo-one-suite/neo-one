import { Observable } from 'rxjs';

// tslint:disable-next-line export-name
export const createChanges$ = <T>(
  db: PouchDB.Database<T>,
  options: PouchDB.Core.ChangesOptions = { since: 'now', live: true, include_docs: true },
) =>
  new Observable<PouchDB.Core.ChangesResponseChange<T>>((observer) => {
    const changes = db
      .changes(options)
      .on('change', (change) => {
        observer.next(change);
      })
      .on('error', (error: Error) => {
        observer.error(error);
      })
      .on('complete', () => {
        observer.complete();
      });

    return () => changes.cancel();
  });
