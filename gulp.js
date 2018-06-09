/* @flow */
/* eslint import/no-extraneous-dependencies: ['error', {'devDependencies': true}] */
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

const getSourcePackage = (source: string) => JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, 'packages', source, 'package.json'),
    'utf-8',
  ),
);

const sources = fs
  .readdirSync('packages')
  .filter(file => !file.startsWith('.'))
  .filter(source => !getSourcePackage(source).noCompile);

const dependencies = [
  ...new Set(
    sources.reduce(
      (acc, source) =>
        acc.concat(
          Object.keys((getSourcePackage(source).dependencies || {})),
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
type Entry = 'node' | 'browser';

const getBabelConfig = ({
  modules,
  entry,
  useBuiltIns,
  typescript,
}: {|
  modules: boolean | string,
  entry: Entry,
  useBuiltIns?: boolean | string,
  typescript: boolean,
|}) => ({
  babelrc: false,
  ...getBabelConfigBase({
    modules,
    useBuiltIns,
    targets: entry === 'node'
      ? { node: '8.9.0' }
      : { browsers: ['> 1%', 'last 2 versions', 'not ie <= 10'] },
    typescript,
  }),
});

const getEntryFile = (entry: Entry) =>
  entry === 'node' ? 'index' : 'index.browser';

const createRollupInput = ({ source, entry }: {| source: string, entry: Entry |}) => {
  const dir = path.join('packages', source, 'src');
  const indexJS = path.join(dir, `${getEntryFile(entry)}.js`);
  const indexTS = path.join(dir, `${getEntryFile(entry)}.ts`);
  const isJS = fs.pathExistsSync(indexJS);
  const input = isJS ? indexJS : indexTS;
  return {
    input,
    external: (module: string) =>
      dependencies.some(dep => dep !== source && module.startsWith(dep)),
    plugins: [
      resolve({
        module: true,
        jsnext: true,
        main: true,
        preferBuiltins: true,
        extensions: ['.js', '.ts'],
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
        exclude: path.join('node_modules', '**'),
        ...getBabelConfig({ modules: false, entry, typescript: !isJS }),
      }),
      sourcemaps(),
    ],
  };
};

const createRollupOutput = ({
  source,
  format,
  entry,
}: {|
  source: string,
  format: Format,
  entry: Entry,
|}) => ({
  file: path.join(
    'packages',
    source,
    'dist',
    `${getEntryFile(entry)}${format === 'cjs' ? '' : `.${format}`}.js`
  ),
  format,
  name: source,
  sourcemap: process.env.NEO_ONE_BUILD_INLINE_SOURCEMAP === 'true'
    ? 'inline'
    : true,
  exports: 'named',
});

const writeBundle = async ({
  source,
  bundle,
  format,
  entry,
}: {|
  source: string,
  bundle: any,
  format: Format,
  entry: Entry,
|}) => {
  await bundle.write(createRollupOutput({ source, format, entry }));
};

const writeBundles = async ({
  source,
  bundle,
  entry,
}: {|
  source: string,
  bundle: any,
  entry: Entry,
|}) => {
  await Promise.all(
    FORMATS.map(format =>
      writeBundle({
        source,
        bundle,
        format,
        entry,
      }),
    ),
  );
};

const buildSource = async ({
  source,
  entry,
}: {|
  source: string,
  entry: Entry,
|}) => {
  const bundle = await rollup(createRollupInput({ source, entry }));

  await writeBundles({ source, bundle, entry });
}

const getSourcesAndEntries = () => Promise.all(
  sources.map(async source => {
    const dir = path.join('packages', source, 'src');
    const [existsIndex, existsIndexTS, existsIndexBrowser, existsIndexBrowserTS] = await Promise.all([
      fs.pathExists(path.join(dir, 'index.js')),
      fs.pathExists(path.join(dir, 'index.ts')),
      fs.pathExists(path.join(dir, 'index.browser.js')),
      fs.pathExists(path.join(dir, 'index.browser.ts')),
    ]);
    const result = [];
    if (existsIndex || existsIndexTS) {
      result.push({ source, entry: 'node' });
    }
    if (existsIndexBrowser || existsIndexBrowserTS) {
      result.push({ source, entry: 'browser' });
    }

    return result;
  })
).then(result => result.reduce((acc, value) => acc.concat(value), []));

gulp.task('build:dist', async () => {
  const sourcesAndEntries = await getSourcesAndEntries();
  await Promise.all(sourcesAndEntries.map(
    ({ source, entry }) => buildSource({ source, entry }),
  ));
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
  sources
    .filter(source => fs.pathExistsSync(path.resolve(__dirname, 'packages', source, 'src', 'index.js')))
    .forEach(source => {
      const dir = path.join('packages', source, 'dist');
      fs.ensureDirSync(dir);
      fs.writeFileSync(path.join(dir, 'index.js.flow'), flowIndex);
    }),
);

const base = path.join(__dirname, 'packages');
const srcBinGlob = path.join('packages', '*', 'src', 'bin', '*');
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
          entry: 'node',
          typescript: false,
        }),
      ),
    )
    .pipe(gulp.dest(base)),
);

gulp.task('build', ['build:bin', 'build:flow']);

const createRollupWatch = ({ source }: {| source: string |}) => ({
  include: path.join('packages', source, 'src', '**'),
});
const createWatchConfig = ({ source, entry }: {| source: string, entry: Entry |}) => ({
  ...createRollupInput({ source, entry }),
  output: FORMATS.map(format => createRollupOutput({ format, source, entry })),
  watch: createRollupWatch({ source }),
});

gulp.task('watch', async () => {
  const sourcesAndEntries = await getSourcesAndEntries();
  const watcher = watch(sourcesAndEntries.map(
    ({ source, entry }) => createWatchConfig({ source, entry }),
  ));

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
