/* @flow */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);

export const getPackageJSONBackup = (file: string) => `${file}.backup`;

export const getPackageJSONPaths = async (): Promise<Array<string>> => {
  const packages = `.${path.sep}packages`;
  const files = await readdir(packages);
  return files
    .filter(file => !file.startsWith('.'))
    .map(file => path.resolve(packages, file, 'package.json'));
};
