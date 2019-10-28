import execa from 'execa';
import fs from 'fs-extra';
import path from 'path';
import yargs from 'yargs';
import { Format, getFormat } from './formats';
import { getName } from './utils';

const defaultReleaseFormat = process.env.NEO_ONE_BUILD_FORMAT !== undefined ? process.env.NEO_ONE_BUILD_FORMAT : 'main';

const { argv } = yargs
  .string('format')
  .choices('format', ['main', 'next', 'browserify'])
  .default('format', defaultReleaseFormat);

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const rushJSON = fs.readJsonSync(path.resolve(APP_ROOT_DIR, 'rush.json'));
const PUBLISH_SCRIPT = path.resolve(__dirname, '..', 'scripts', 'try-publish');

// tslint:disable: no-any
const packages: readonly string[] = rushJSON.projects
  .filter((project: any) => project.shouldPublish)
  .map((project: any) => project.projectFolder.slice('packages/'.length));
// tslint:enable no-any

const publishPackage = async (format: Format, pkgName: string) => {
  await execa(PUBLISH_SCRIPT, {
    cwd: path.resolve(APP_ROOT_DIR, 'dist', format.dist, getName(format, pkgName)),
    stdio: ['ignore', 'inherit', 'inherit'],
  });
};

export const publish = async () => {
  const format = getFormat(argv.format);
  await packages.reduce<Promise<void>>(async (promise, pkg) => {
    await promise;

    return publishPackage(format, pkg);
  }, Promise.resolve());
};
