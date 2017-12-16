/* @flow */
import fs from 'fs';
import { promisify } from 'util';

import * as common from './common';
import * as utils from './utils';

const unlink = promisify(fs.unlink);

const restorePackageJSON = (file: string): Promise<void> => {
  const out = common.getPackageJSONBackup(file);
  return utils.copyFile(out, file);
};

const rewritePackageJSON = async (file: string): Promise<void> => {
  await restorePackageJSON(file);
  await unlink(common.getPackageJSONBackup(file));
};

const run = async () => {
  const paths = await common.getPackageJSONPaths();
  await Promise.all(paths.map(file => rewritePackageJSON(file)));
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    // eslint-disable-next-line
    console.error(error);
    process.exit(1);
  });
