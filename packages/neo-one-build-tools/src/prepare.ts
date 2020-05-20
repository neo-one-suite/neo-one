import fs from 'fs-extra';
import path from 'path';

interface RushProject {
  readonly shouldPublish?: boolean;
  readonly projectFolder: string;
}

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const RUSH_PATH = path.resolve(APP_ROOT_DIR, 'rush.json');
const LICENSE_PATH = path.resolve(APP_ROOT_DIR, 'LICENSE');
const README_PATH = path.resolve(APP_ROOT_DIR, 'README.md');

const rushJSON = JSON.parse(fs.readFileSync(RUSH_PATH, 'utf-8'));
const packages = rushJSON.projects
  .filter((project: RushProject) => project.shouldPublish)
  .map((project: RushProject) => project.projectFolder.slice('packages/'.length));

const getFullPath = (pkg: string) => path.resolve(APP_ROOT_DIR, 'packages', pkg);

export const prepare = () =>
  packages.forEach((pkg: string) => {
    const pkgPath = getFullPath(pkg);
    fs.copyFileSync(LICENSE_PATH, path.resolve(pkgPath, 'LICENSE'));
    fs.copyFileSync(README_PATH, path.resolve(pkgPath, 'README.md'));
  });
