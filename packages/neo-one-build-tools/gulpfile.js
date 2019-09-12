const fs = require('fs-extra');
const gulp = require('gulp');
const gulpRename = require('gulp-rename');
const path = require('path');
// const sourceMaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');

const flattenSource = gulpRename((name) => {
  if (name.dirname === undefined) {
    return;
  }
  // tslint:disable-next-line: no-object-mutation
  name.dirname = name.dirname
    .split(path.sep)
    .filter((dir) => dir !== 'src')
    .join(path.sep);
});

const clean = async () => fs.remove('lib');

const buildTools = () =>
  gulp
    .src(['src/**/*.js', 'src/**/*.ts'])
    .pipe(ts.createProject('./tsconfig.json')())
    .pipe(flattenSource)
    .pipe(gulp.dest('lib'));

gulp.task('default', async (done) => {
  await clean();
  buildTools();
  done();
});
