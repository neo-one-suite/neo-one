/* @flow */
import { Observable } from 'rxjs/Observable';
import { type Readable } from 'stream';

export default (getStream: () => Readable): Observable<Buffer> =>
  Observable.create(observer => {
    const stream = getStream();
    let done = false;
    const cleanup = () => {
      if (!done) {
        done = true;
        // eslint-disable-next-line
        stream.removeListener('end', onEnd);
        // eslint-disable-next-line
        stream.removeListener('error', onError);
        // eslint-disable-next-line
        stream.removeListener('data', onData);
      }
    };
    const onEnd = () => {
      cleanup();
      observer.complete();
    };
    const onError = (error: Error) => {
      cleanup();
      observer.error(error);
    };
    const onData = (data: Buffer) => observer.next(data);

    stream.once('error', onError);
    stream.once('end', onEnd);
    stream.on('data', onData);

    return () => cleanup();
  });
