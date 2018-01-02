/* @flow */
/* eslint import/no-extraneous-dependencies: ['error', {'devDependencies': true}] */
// flowlint untyped-import:off
import babel from 'rollup-plugin-babel';
import fs from 'fs-extra';
import gulp from 'gulp';
import gulpBabel from 'gulp-babel';
import gutil from 'gulp-util';
import json from 'rollup-plugin-json';
import newer from 'gulp-newer';
import path from 'path';
import plumber from 'gulp-plumber';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import { rollup, watch } from 'rollup';
import sourcemaps from 'rollup-plugin-sourcemaps';
import through from 'through2';

import getBabelConfigBase from './scripts/getBabelConfig';

gulp.task('default', ['build']);

const sources = fs
  .readdirSync('packages')
  .filter(file => !file.startsWith('.'));

const dependencies = [
  ...new Set(
    sources.reduce(
      (acc, source) =>
        acc.concat(
          Object.keys(
            (JSON.parse(
              fs.readFileSync(
                path.resolve('./packages', source, './package.json'),
                'utf-8',
              ),
            ).dependencies || {}),
          ),
        ),
      [],
    ),
  ),
].concat([
  'child_process',
  'crypto',
  'events',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'perf_hooks',
  'stream',
  'util',
  'zlib',
]);

const FORMATS = ['cjs', 'es'];
type Format = 'cjs' | 'es';

const getBabelConfig = ({
  modules,
  useBuiltIns,
}: {|
  modules: boolean | string,
  useBuiltIns?: boolean | string,
|}) => ({
  babelrc: false,
  ...getBabelConfigBase({ modules, useBuiltIns }),
});

const createRollupInput = ({ source }: {| source: string |}) => {
  const dir = `./packages/${source}/src/`;
  return {
    input: `${dir}index.js`,
    external: (module: string) =>
      dependencies.some(dep => dep !== source && module.startsWith(dep)),
    plugins: [
      resolve({
        module: true,
        jsnext: true,
        main: true,
        preferBuiltins: true,
      }),
      replace({
        include: 'node_modules/JSONStream/index.js',
        values: {
          '#!/usr/bin/env node': '',
          '#! /usr/bin/env node': '',
        },
      }),
      json({ preferConst: true }),
      babel({
        exclude: 'node_modules/**',
        ...getBabelConfig({ modules: false }),
      }),
      sourcemaps(),
    ],
  };
};

const createRollupOutput = ({
  source,
  format,
}: {|
  source: string,
  format: Format,
|}) => ({
  file: `./packages/${source}/dist/${format === 'cjs' ? 'index' : format}.js`,
  format,
  name: source,
  sourcemap: true,
});

const writeBundle = async ({
  source,
  bundle,
  format,
}: {|
  source: string,
  bundle: any,
  format: Format,
|}) => {
  await bundle.write(createRollupOutput({ source, format }));
};

const writeBundles = async ({
  source,
  bundle,
}: {|
  source: string,
  bundle: any,
|}) => {
  await Promise.all(
    FORMATS.map(format =>
      writeBundle({
        source,
        bundle,
        format,
      }),
    ),
  );
};

const buildSource = async ({ source }: {| source: string |}) => {
  const bundle = await rollup(createRollupInput({ source }));

  await writeBundles({ source, bundle });
};

gulp.task('build:dist', async () => {
  await Promise.all(sources.map(source => buildSource({ source })));
});

function swapSrcWithDist(srcPath) {
  const parts = srcPath.split(path.sep);
  parts[1] = 'dist';
  return parts.join(path.sep);
}

const flowIndex = `/* @flow */

export * from '../src';
`;

gulp.task('build:flow', () =>
  sources.forEach(source => {
    const dir = `./packages/${source}/dist`;
    fs.ensureDirSync(dir);
    fs.writeFileSync(`${dir}/index.js.flow`, flowIndex);
  }),
);

const base = path.join(__dirname, 'packages');
const srcBinGlob = './packages/*/src/bin/*';
const transformSrc = ({ glob, map }: {| glob: string, map: any |}) =>
  gulp
    .src(glob, { base })
    .pipe(
      plumber({
        errorHandler: err => {
          gutil.log(err.stack);
        },
      }),
    )
    .pipe(newer({ dest: base, map }))
    .pipe(
      through.obj((file, enc, callback) => {
        // eslint-disable-next-line
        file.path = path.resolve(file.base, swapSrcWithDist(file.relative));
        callback(null, file);
      }),
    );

gulp.task('build:bin', ['build:dist'], () =>
  transformSrc({ glob: srcBinGlob, map: swapSrcWithDist })
    .pipe(
      gulpBabel(
        getBabelConfig({
          modules: 'commonjs',
          useBuiltIns: 'entry',
        }),
      ),
    )
    .pipe(gulp.dest(base)),
);

gulp.task('build', ['build:bin', 'build:flow']);

const createRollupWatch = ({ source }: {| source: string |}) => ({
  include: `./packages/${source}/src/**`,
});
const createWatchConfig = ({ source }: {| source: string |}) => ({
  ...createRollupInput({ source }),
  output: FORMATS.map(format => createRollupOutput({ format, source })),
  watch: createRollupWatch({ source }),
});

gulp.task('watch', () => {
  const watcher = watch(sources.map(source => createWatchConfig({ source })));

  watcher.on('event', event => {
    if (event.code === 'BUNDLE_START') {
      // eslint-disable-next-line
      console.log('Building bundle...');
    } else if (event.code === 'BUNDLE_END') {
      // eslint-disable-next-line
      console.log('Done.');
    } else if (event.code === 'ERROR') {
      // eslint-disable-next-line
      console.log('Error.');
      // eslint-disable-next-line
      console.log(event);
    }
  });
});
