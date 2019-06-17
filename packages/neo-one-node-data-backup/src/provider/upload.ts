import { Writable } from 'stream';
import * as tar from 'tar';

export const upload = async ({
  dataPath,
  fileList,
  write,
}: {
  readonly dataPath: string;
  readonly fileList: readonly string[];
  readonly write: Writable;
}) => {
  await new Promise<void>((resolve, reject) => {
    const read = tar.create(
      {
        gzip: true,
        cwd: dataPath,
        strict: true,
        portable: true,
      },
      fileList,
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
