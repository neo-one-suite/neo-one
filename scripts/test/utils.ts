import * as fs from 'fs';

// tslint:disable-next-line export-name
export const copyFile = async (path: string, to: string): Promise<void> => {
  const inStream = fs.createReadStream(path);
  const outStream = fs.createWriteStream(to);

  return new Promise<void>((resolve, reject) => {
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
