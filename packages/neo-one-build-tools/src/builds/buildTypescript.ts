// tslint:disable: no-any match-default-export-name
import gulp from 'gulp';
import gulpPlumber from 'gulp-plumber';
// import gulpSourcemaps from 'gulp-sourcemaps';
import ts from 'gulp-typescript';
// import path from 'path';
import typescript from 'typescript';
import { Format } from '../formats';
import {
  filterJS,
  flattenSource,
  gulpReplaceModule,
  replaceBNImport,
  replaceBNTypeImport,
  replaceInternalSources,
  replaceRXJSImport,
  replaceStatic,
  // transformPackage,
} from '../utils';

export interface CompileTypescriptOptions {
  readonly stripInternal: boolean;
}

// tslint:disable-next-line: readonly-array
export const buildTypescript = (format: Format, pkgName?: string) => (
  glob: string[],
  options: CompileTypescriptOptions = { stripInternal: false },
) => {
  const isToolsPackage = pkgName === '@neo-one/developer-tools';

  const project = ts.createProject(format.tsconfig, {
    typescript,
    baseUrl: process.cwd(),
    stripInternal: options.stripInternal,
  });

  return gulpReplaceModule(
    format,
    gulp
      .src(glob)
      .pipe(gulpPlumber())
      .pipe(project())
      .pipe(replaceRXJSImport(format))
      .pipe(replaceInternalSources)
      .pipe(replaceBNTypeImport)
      .pipe(replaceBNImport)
      .pipe(replaceStatic)
      .pipe(flattenSource)
      .pipe(filterJS(isToolsPackage)),
  ).pipe(gulp.dest('lib'));
};
