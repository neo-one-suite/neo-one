// tslint:disable: match-default-export-name
import fs from 'fs-extra';
import gulp from 'gulp';
// @ts-ignore
import gulpBanner from 'gulp-banner';
import gulpPlumber from 'gulp-plumber';
import gulpRename from 'gulp-rename';
// import gulpSourcemaps from 'gulp-sourcemaps';
import ts from 'gulp-typescript';
import path from 'path';
import typescript from 'typescript';
import { Format, MAIN_FORMAT } from '../formats';
import {
  DIST,
  flattenBin,
  getInternalDependencies,
  getPackageJSON,
  gulpReplaceBin,
  gulpReplaceModule,
  replaceCmd,
} from '../utils';

const gulpBin = (binPath: string, internalDeps: readonly string[]) =>
  gulpReplaceModule(MAIN_FORMAT, internalDeps, gulp.src(binPath)).pipe(
    gulpRename((parsedPath) => {
      if (parsedPath.dirname === undefined) {
        throw new Error('error creating bin');
      }
      // tslint:disable-next-line: no-object-mutation
      parsedPath.dirname = `${parsedPath.dirname.slice(0, -'/src/bin'.length)}/bin`;
    }),
  );

const binProject = ts.createProject(MAIN_FORMAT.tsconfig, {
  typescript,
  declaration: false,
});

const binBanner = `#!/usr/bin/env node
require('source-map-support').install({ handleUncaughtExceptions: false, environment: 'node' });
`;

const compileBin = (binGlob: string, deps: readonly string[], binLib: string) =>
  gulpBin(binGlob, deps)
    .pipe(gulpPlumber())
    // .pipe(gulpSourcemaps.init())
    .pipe(binProject())
    .pipe(gulpBanner(binBanner))
    // .pipe(gulpSourcemaps.mapSources(mapSources))
    // .pipe(gulpSourcemaps.write())
    .pipe(replaceCmd)
    .pipe(flattenBin)
    .pipe(gulpReplaceBin(binLib))
    .pipe(gulp.dest(path.join(DIST)));

export const buildBin = (format: Format) => async () => {
  if (format.name !== '') {
    return;
  }

  const pkgJSON = await getPackageJSON();
  const internalDependencies = getInternalDependencies(pkgJSON);
  const binPath = path.join(process.cwd(), 'src', 'bin');
  if (!fs.existsSync(binPath)) {
    return;
  }

  const binGlob = `${binPath}/*.ts`;

  compileBin(binGlob, internalDependencies, pkgJSON.name);
};
