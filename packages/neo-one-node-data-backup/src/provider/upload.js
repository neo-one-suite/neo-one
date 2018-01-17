/* @flow */
import type { Writable } from 'stream';

import tar from 'tar';

export default async ({
  dataPath,
  write,
}: {|
  dataPath: string,
  write: Writable,
|}) => {
  await new Promise((resolve, reject) => {
    const read = tar.create(
      {
        gzip: true,
        cwd: dataPath,
        strict: true,
        portable: true,
      },
      ['.'],
    );

    let done = false;
    const cleanup = () => {
      done = true;
    };

    const onDone = () => {
      if (!done) {
        cleanup();
        resolve();
      }
    };

    const onError = (error: Error) => {
      if (!done) {
        cleanup();
        reject(error);
      }
    };

    read.once('error', onError);
    write.once('error', onError);
    write.once('finish', onDone);
    write.once('complete', onDone);

    read.pipe(write);
  });
};
