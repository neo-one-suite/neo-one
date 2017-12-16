/* @flow */
import fs from 'fs';

// eslint-disable-next-line
export const copyFile = (path: string, to: string): Promise<void> => {
  const inStream = fs.createReadStream(path);
  const outStream = fs.createWriteStream(to);

  return new Promise((resolve, reject) => {
    let rejected = false;
    const onError = (error: Error) => {
      if (!rejected) {
        rejected = true;
        reject(error);
      }
    };
    inStream.on('error', onError);
    outStream.on('error', onError);
    outStream.on('finish', resolve);
    inStream.pipe(outStream);
  });
};
