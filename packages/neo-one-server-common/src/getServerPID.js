/* @flow */
import fs from 'fs-extra';

export default async ({ pidPath }: {| pidPath: string |}): Promise<?number> => {
  let pidContents;
  try {
    pidContents = await fs.readFile(pidPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }

  try {
    return parseInt(pidContents, 10);
  } catch (error) {
    await fs.remove(pidPath);
    return null;
  }
};
