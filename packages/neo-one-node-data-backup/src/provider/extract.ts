import fs from 'fs';
import { Throttle } from 'stream-throttle';
import tar from 'tar';

export const extract = async ({
  downloadPath,
  dataPath,
  writeBytesPerSecond,
}: {
  readonly downloadPath: string;
  readonly dataPath: string;
  readonly writeBytesPerSecond: number;
}) => {
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(downloadPath);
    const tarExtract = tar.extract({
      strip: 0,
      cwd: dataPath,
      strict: true,
    });

    const throttle = new Throttle({ rate: writeBytesPerSecond });

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

    stream.once('error', onError);
    throttle.once('error', onError);
    tarExtract.once('error', onError);
    tarExtract.once('finish', onDone);

    stream.pipe(throttle).pipe(tarExtract);
  });
};
