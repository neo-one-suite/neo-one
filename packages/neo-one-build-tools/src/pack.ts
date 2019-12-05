import fs from 'fs-extra';
// tslint:disable-next-line: match-default-export-name
import gulp from 'gulp';
import path from 'path';
import { Format } from './formats';
import { getName, getPackageJSON, gulpReplaceBinPack, gulpReplaceInternalSources, transformPackage } from './utils';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

const getPackageDist = (format: Format, pkgName: string) =>
  path.resolve(APP_ROOT_DIR, 'dist', format.dist, getName(format, pkgName.slice(1).replace('/', '-')));

const getTransformSources = (format: Format, internalDeps: readonly string[]) => (glob: string[]) =>
  gulpReplaceInternalSources(format, internalDeps, gulp.src(glob));

const transformPackageJSON = async (format: Format, pkgName: string) => {
  const packageJSON = await getPackageJSON();
  await fs.writeFile(
    path.resolve(getPackageDist(format, pkgName), 'package.json'),
    JSON.stringify(transformPackage(format, packageJSON), undefined, 2),
    'utf-8',
  );
};

const copyMetaData = async (format: Format, pkgName: string) => {
  const packageDist = getPackageDist(format, pkgName);

  return Promise.all([
    fs.copyFile(path.resolve(APP_ROOT_DIR, 'LICENSE'), path.resolve(packageDist, 'LICENSE')),
    fs.copyFile(path.resolve(APP_ROOT_DIR, 'README.md'), path.resolve(packageDist, 'README.md')),
  ]);
};

export const copyData = (format: Format, pkgName: string) => async () => {
  const packageDist = getPackageDist(format, pkgName);
  await fs.ensureDir(packageDist);
  await Promise.all([transformPackageJSON(format, pkgName), copyMetaData(format, pkgName)]);
};

export const pack = (format: Format, pkgName: string, dependencies: readonly string[]) => {
  const transformSources = getTransformSources(format, dependencies);

  return (glob: string[]) => transformSources(glob).pipe(gulp.dest(getPackageDist(format, pkgName)));
};

export const packBin = (format: Format, pkgName: string) => () => {
  gulp
    .src('bin/**')
    .pipe(gulpReplaceBinPack())
    .pipe(gulp.dest(path.resolve(getPackageDist(format, pkgName), 'bin')));
};
