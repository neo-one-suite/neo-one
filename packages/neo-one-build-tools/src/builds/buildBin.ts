// tslint:disable: match-default-export-name
import fs from 'fs-extra';
import gulp from 'gulp';
// @ts-ignore
import gulpBanner from 'gulp-banner';
import gulpPlumber from 'gulp-plumber';
import gulpRename from 'gulp-rename';
import gulpSourcemaps from 'gulp-sourcemaps';
import ts from 'gulp-typescript';
import path from 'path';
import typescript from 'typescript';
import { Format } from '../formats';
import { flattenBin, gulpReplaceBin, gulpReplaceModule, replaceCmd } from '../utils';

const gulpBin = (format: Format, binPath: string) =>
  gulpReplaceModule(format, gulp.src(binPath))
    .pipe(gulpSourcemaps.init())
    .pipe(
      gulpRename((parsedPath) => {
        if (parsedPath.dirname === undefined) {
          throw new Error('error creating bin');
        }
        // tslint:disable-next-line: no-object-mutation
        parsedPath.dirname = `${parsedPath.dirname.slice(0, -'/src/bin'.length)}/bin`;
      }),
    );

const binBanner = `#!/usr/bin/env node
require('source-map-support').install({ handleUncaughtExceptions: false, environment: 'node' });
`;

const compileBin = (format: Format, binGlob: string) => {
  const binProject = ts.createProject(format.tsconfig, {
    typescript,
    declaration: false,
  });

  return gulpBin(format, binGlob)
    .pipe(gulpPlumber())
    .pipe(binProject())
    .pipe(gulpBanner(binBanner))
    .pipe(replaceCmd)
    .pipe(flattenBin)
    .pipe(gulpReplaceBin())
    .pipe(gulpSourcemaps.write('.', { includeContent: false, sourceRoot: '../src' }))
    .pipe(gulp.dest('lib'));
};

export const buildBin = (format: Format) => () => {
  /* build bin for main format only */
  if (format.name !== '') {
    return;
  }

  const binPath = path.join(process.cwd(), 'src', 'bin');
  if (!fs.existsSync(binPath)) {
    return;
  }

  const binGlob = `${binPath}/*.ts`;

  return compileBin(format, binGlob);
};
