import * as tar from 'tar';

export const extract = async ({
  downloadPath,
  dataPath,
}: {
  readonly downloadPath: string;
  readonly dataPath: string;
  readonly writeBytesPerSecond: number;
}) => {
  await tar.extract({
    file: downloadPath,
    cwd: dataPath,
  });
};
