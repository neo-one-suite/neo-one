import * as tar from 'tar';

export const extract = async ({
  downloadPath,
  dataPath,
}: {
  readonly downloadPath: string;
  readonly dataPath: string;
}) => {
  await tar.extract({
    file: downloadPath,
    cwd: dataPath,
  });
};
