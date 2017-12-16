/* @flow */
import { Throttle } from 'stream-throttle';

import fs from 'fs';
import tar from 'tar';

export default async ({
  downloadPath,
  dataPath,
  writeBytesPerSecond,
}: {|
  downloadPath: string,
  dataPath: string,
  writeBytesPerSecond: number,
|}) => {
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(downloadPath);
    const extract = tar.extract({
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
    extract.once('error', onError);
    extract.once('finish', onDone);

    stream.pipe(throttle).pipe(extract);
  });
};
