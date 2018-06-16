import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as common from './common';
import * as utils from './utils';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const backupPackageJSON = async (file: string): Promise<void> => {
  const out = common.getPackageJSONBackup(file);

  return utils.copyFile(file, out);
};

const rewritePackageJSON = async (file: string): Promise<void> => {
  const pkgString = await readFile(file);
  // tslint:disable-next-line no-any
  const pkg = JSON.parse(pkgString as any);
  const main = path.resolve(path.dirname(file), 'src', 'index.js');
  if (pkg.main !== main) {
    // tslint:disable-next-line no-object-mutation
    pkg.main = main;
    await backupPackageJSON(file);
    await writeFile(file, JSON.stringify(pkg));
  }
};

const run = async () => {
  const paths = await common.getPackageJSONPaths();
  await Promise.all(paths.map(async (file) => rewritePackageJSON(file)));
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    // tslint:disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
