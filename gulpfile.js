const _ = require('lodash');
const appRootDir = require('app-root-dir');
const execa = require('execa');
const fs = require('fs-extra');
const gulp = require('gulp');
const gulpBabel = require('gulp-babel');
const gulpFilter = require('gulp-filter');
const gulpNewer = require('gulp-newer');
const gulpPlumber = require('gulp-plumber');
const gulpRename = require('gulp-rename');
const gulpReplace = require('gulp-replace');
const gulpBanner = require('gulp-banner');
const jsonTransform = require('gulp-json-transform');
const gulpSourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const path = require('path');
const through2 = require('through2');
const typescript = require('typescript');
const pkg = require('./package.json');

const rollup = require('rollup');
const rollupString = require('rollup-plugin-string');
const rollupTypescript = require('rollup-plugin-typescript2');

const FORMATS = [
  {
    main: true,
    target: 'es2017',
    module: 'cjs',
  },
  {
    target: 'esnext',
    module: 'esm',
  },
].map(({ target, module, main }) => ({
  target,
  module,
  dist: main ? 'neo-one' : `neo-one-${target}-${module}`,
  name: main ? '' : `${target}-${module}`,
  tsconfig: `tsconfig/tsconfig.${target}.${module}.json`,
  tsconfigESM: `tsconfig/tsconfig.${target}.esm.json`,
  fastProject: ts.createProject(`tsconfig/tsconfig.${target}.${module}.json`, { typescript, isolatedModules: true }),
  project: ts.createProject(`tsconfig/tsconfig.${target}.${module}.json`, { typescript }),
}));
const MAIN_FORMAT = FORMATS[0];
const MAIN_BIN_FORMAT = FORMATS[0];

function getTaskHash(format, ...args) {
  return [format.target, format.module].concat(args.filter((x) => x !== void 0 && x !== '')).join(`:`);
}

let noCache = false;
const memoizeTask = (cache, taskFn) => (format, ...args) => {
  // Give the memoized fn a displayName so gulp's output is easier to follow.
  const fn = (done) => {
    if (noCache) {
      return taskFn(format, done, ...args);
    }

    return cache[getTaskHash(format, ...args)] || (cache[getTaskHash(format, ...args)] = taskFn(format, done, ...args));
  };
  fn.displayName = `${taskFn.name || ``}:${getTaskHash(format, ...args)}:task`;
  return fn;
};

const DIST = 'dist';
const getDistBase = (format) => path.join(DIST, format.dist);
const getDistBaseCWD = (format) => path.resolve(appRootDir.get(), getDistBase(format));
const getDest = (format) => path.join(getDistBase(format), 'packages');

const getPackageJSON = (pkg) => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve('packages', pkg, 'package.json'), 'utf-8'));
  } catch (error) {
    console.log(`Invalid package.json: ${pkg}`);
    console.error(error);
    throw error;
  }
};

const SKIP_PACKAGES = new Set([
  'neo-one-developer-tools-frame',
  'neo-one-editor',
  'neo-one-editor-server',
  'neo-one-local-browser',
  'neo-one-local-browser-worker',
  'neo-one-local-singleton',
  'neo-one-node-browser',
  'neo-one-node-browser-worker',
  'neo-one-smart-contract-test-browser',
  'neo-one-website',
  'neo-one-worker',
]);
const SKIP_PACKAGES_LIST = [...SKIP_PACKAGES];

const pkgs = fs
  .readdirSync('packages')
  .filter((file) => !file.startsWith('.'))
  .filter((file) => !SKIP_PACKAGES.has(file))
  .filter((pkg) => fs.pathExistsSync(path.resolve('packages', pkg, 'package.json')));
const pkgJSONs = pkgs.map((pkg) => [pkg, getPackageJSON(pkg)]);
const smartContractPkgs = pkgJSONs.filter(([_p, pkgJSON]) => pkgJSON.smartContract).map(([p]) => p);
const smartContractPkgNames = pkgJSONs
  .filter(([_p, pkgJSON]) => pkgJSON.smartContract)
  .map(([_p, pkgJSON]) => pkgJSON.name);
const browserPkgs = pkgJSONs.filter(([_p, pkgJSON]) => pkgJSON.browser !== undefined).map(([p]) => p);
const browserPkgNames = pkgJSONs
  .filter(([_p, pkgJSON]) => pkgJSON.browser !== undefined)
  .map(([_p, pkgJSON]) => pkgJSON.name);
const indexPkgs = pkgs.filter((p) => !smartContractPkgs.includes(p));
const pkgNames = pkgJSONs.map(([_p, pkgJSON]) => pkgJSON.name);
const pkgNamesSet = new Set(pkgNames);

const skipGlobs = SKIP_PACKAGES_LIST.map((pkg) => `!packages/${pkg}/**/*`);

const globs = {
  originalSrc: [
    'packages/*/src/**/*.{ts,tsx,js}',
    'packages/*/template/**/*',
    'packages/*/proto/**/*.proto',
    '!packages/*/src/**/*.test.{ts,tsx}',
    '!packages/*/src/__data__/**/*',
    '!packages/*/src/__tests__/**/*',
    '!packages/*/src/__e2e__/**/*',
    '!packages/*/src/bin/**/*',
  ].concat(skipGlobs),
  src: (format) => [
    `${getDistBase(format)}/packages/*/src/**/*.{ts,tsx}`,
    `!${getDistBase(format)}/packages/*/src/**/*.test.{ts,tsx}`,
    `!${getDistBase(format)}/packages/*/src/__data__/**/*`,
    `!${getDistBase(format)}/packages/*/src/__tests__/**/*`,
    `!${getDistBase(format)}/packages/*/src/__e2e__/**/*`,
    `!${getDistBase(format)}/packages/*/src/bin/**/*`,
    `!${getDistBase(format)}/packages/neo-one-developer-tools/src/*.ts`,
    `!${getDistBase(format)}/packages/neo-one-developer-tools-frame/src/*.ts`,
    `!${getDistBase(format)}/packages/neo-one-smart-contract-lib/src/*.ts`,
    `!${getDistBase(format)}/packages/neo-one-server-plugin-wallet/src/contracts/*.ts`,
  ],
  types: ['packages/neo-one-types/**/*', '!packages/neo-one-types/package.json'],
  bin: ['packages/*/src/bin/*.ts'].concat(skipGlobs),
  pkg: ['packages/*/package.json'].concat(skipGlobs),
  pkgFiles: ['packages/*/CHANGELOG.md', 'packages/*/tsconfig.json', 'packages/*/static/**/*'].concat(skipGlobs),
  files: ['lerna.json', 'yarn.lock', 'tsconfig.json'],
  metadata: ['LICENSE', 'README.md'],
};

const getName = (format, name) => (format.name === '' ? name : `${name}-${format.name}`);
const getBin = (format, file) => {
  if (format.name !== '') {
    return undefined;
  }

  const pkgPath = path.join('packages', path.dirname(file.relative));
  const binDir = path.join(pkgPath, 'src', 'bin');
  const exists = fs.existsSync(binDir);
  if (!exists) {
    return undefined;
  }

  const binFiles = fs.readdirSync(binDir);
  return _.fromPairs(
    _.flatMap(
      binFiles.map((binFile) => {
        const fileName = path.basename(binFile, '.ts');
        return [[fileName, `./bin/${fileName}`], [`${fileName}.js`, `./bin/${fileName}.js`]];
      }),
    ),
  );
};
const DEP_MAPPING = {
  esnext: {
    esm: {
      '@reactivex/ix-es2015-cjs': '@reactivex/ix-esnext-esm',
    },
    cjs: {
      '@reactivex/ix-es2015-cjs': '@reactivex/ix-esnext-cjs',
    },
  },
  es2017: {
    esm: {
      '@reactivex/ix-es2015-cjs': '@reactivex/ix-es2015-esm',
    },
    cjs: {},
  },
};
const mapDep = (format, depName) => {
  if (pkgNamesSet.has(depName)) {
    return getName(format, depName);
  }

  if (DEP_MAPPING[format.target][format.module][depName] !== undefined) {
    return DEP_MAPPING[format.target][format.module][depName];
  }

  return depName;
};

const transformBasePackageJSON = (format, orig, file) => {
  const bin = getBin(format, file);

  return {
    name: format.name === '' ? orig.name : `${orig.name}-${format.name}`,
    version: orig.version,
    author: pkg.author,
    description: orig.description,
    license: pkg.license,
    homepage: pkg.homepage,
    repository: pkg.repository,
    bugs: pkg.bugs,
    keywords: pkg.keywords,
    bin,
    dependencies:
      orig.dependencies === undefined
        ? undefined
        : _.fromPairs(
            Object.entries(orig.dependencies)
              .filter(([depName]) => depName !== '@neo-one/developer-tools-frame')
              .map(([depName, version]) => [mapDep(format, depName), version]),
          ),
    publishConfig: {
      access: 'public',
    },
    engines: pkg.engines,
  };
};

const transformSrcPackageJSON = (format, orig, file) => ({
  ...transformBasePackageJSON(format, orig, file),
  main: 'src/index.js',
  module: format.module === 'esm' ? 'src/index.js' : undefined,
  types: 'src/index.ts',
  sideEffects: false,
});

const transformSmartContractPackageJSON = (format, orig, file) => ({
  ...transformBasePackageJSON(format, orig, file),
  main: orig.main,
});

const transformBrowserPackageJSON = (format, orig, file) => ({
  ...transformSrcPackageJSON(format, orig, file),
  browser: 'src/index.browser.js',
});

const transformTypesPackageJSON = (format, orig, file) => ({
  ...transformBasePackageJSON(format, orig, file),
  main: 'index.d.ts',
});

const transformPackageJSON = (format, orig, file) =>
  orig.name === '@neo-one/types'
    ? transformTypesPackageJSON(format, orig, file)
    : smartContractPkgNames.some((p) => orig.name === p)
    ? transformSmartContractPackageJSON(format, orig, file)
    : browserPkgNames.some((p) => orig.name === p)
    ? transformBrowserPackageJSON(format, orig, file)
    : transformSrcPackageJSON(format, orig, file);

const copyPkg = ((cache) =>
  memoizeTask(cache, function copyPkg(format) {
    return gulp
      .src(globs.pkg)
      .pipe(jsonTransform((orig, file) => transformPackageJSON(format, orig, file), 2))
      .pipe(gulp.dest(getDest(format)));
  }))({});

const copyPkgFiles = ((cache) =>
  memoizeTask(cache, function copyPkgFiles(format) {
    return gulp.src(globs.pkgFiles).pipe(gulp.dest(getDest(format)));
  }))({});

const copyTypes = ((cache) =>
  memoizeTask(cache, function copyTypes(format) {
    return gulp.src(globs.types).pipe(gulp.dest(path.join(getDest(format), 'neo-one-types')));
  }))({});

const copyMetadata = ((cache) =>
  memoizeTask(cache, function copyMetadata(format) {
    return pkgs.reduce((stream, p) => stream.pipe(gulp.dest(path.join(getDest(format), p))), gulp.src(globs.metadata));
  }))({});

const copyFiles = ((cache) =>
  memoizeTask(cache, function copyFiles(format) {
    return gulp.src(globs.files).pipe(gulp.dest(getDistBase(format)));
  }))({});

const addFast = (format, stream, shouldAdd) =>
  shouldAdd ? stream.pipe(gulpPlumber()).pipe(gulpNewer({ dest: getDest(format), ext: '.js' })) : stream;

const quoted = (value, quote) => `${quote}${value}${quote}`;
const gulpReplaceModule = (format, stream, quote = "'") =>
  Object.entries(DEP_MAPPING[format.target][format.module])
    .concat(format === MAIN_FORMAT ? [] : pkgNames.map((p) => [quoted(p, quote), quoted(mapDep(format, p), quote)]))
    .reduce((streamIn, [moduleName, replaceName]) => streamIn.pipe(gulpReplace(moduleName, replaceName)), stream);
const copyTypescript = ((cache) =>
  memoizeTask(cache, function copyTypescript(format, _done, type) {
    return gulpReplaceModule(format, addFast(format, gulp.src(globs.originalSrc), type === 'fast')).pipe(
      gulp.dest(getDest(format)),
    );
  }))({});
const mapSources = (sourcePath) => path.basename(sourcePath);
const rxjsTypes = new Set(['Observer']);
const compileTypescript = ((cache) =>
  memoizeTask(cache, function compileTypescript(format, _done, type) {
    return gulpReplaceModule(
      format,
      addFast(format, gulp.src(globs.src(format)), type === 'fast')
        .pipe(
          gulpFilter(
            ['**', '!**/*.proto'].concat(smartContractPkgs.map((p) => `!${getDistBase(format)}/packages/${p}/**/*`)),
          ),
        )
        .pipe(gulpSourcemaps.init())
        // .pipe(
        //   gulpBabel({
        //     presets: [],
        //     plugins: [
        //       '@babel/plugin-syntax-numeric-separator',
        //       ['@babel/plugin-syntax-typescript', { isTSX: true }],
        //       '@babel/plugin-syntax-optional-catch-binding',
        //       '@babel/plugin-syntax-dynamic-import',
        //       ['babel-plugin-lodash', { id: ['lodash'] }],
        //       [
        //         'babel-plugin-transform-imports',
        //         {
        //           rxjs: {
        //             transform: (importName) =>
        //               importName === 'EMPTY'
        //                 ? 'rxjs/internal/observable/empty'
        //                 : rxjsTypes.has(importName)
        //                   ? 'rxjs/internal/types'
        //                   : importName[0].toLowerCase() === importName[0]
        //                     ? `rxjs/internal/observable/${importName}`
        //                     : `rxjs/internal/${importName}`,
        //             skipDefaultConversion: true,
        //           },
        //           'rxjs/operators': {
        //             transform: 'rxjs/internal/operators/${member}',
        //             skipDefaultConversion: true,
        //           },
        //         },
        //       ],
        //     ],
        //   }),
        // )
        // .pipe(
        //   gulpRename((parsedPath, file) => {
        //     parsedPath.extname = path.extname(file.history[0]);
        //   }),
        // )
        .pipe(type === 'fast' ? format.fastProject() : format.project())
        .pipe(gulpSourcemaps.mapSources(mapSources))
        .pipe(gulpSourcemaps.write())
        .pipe(gulpReplace('rxjs/internal', `rxjs/${format.module === 'esm' ? '_esm2015/' : ''}internal`)),
      format.module === 'esm' ? "'" : '"',
    ).pipe(gulp.dest(getDest(format)));
  }))({});

gulp.task('compileDeveloperToolsFrame', async () => {
  await execa('yarn', ['compile:developer-tools-frame'], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
});

const APP_ROOT_DIR = __dirname;

const compileDeveloperTools = ((cache) =>
  memoizeTask(cache, async function compileDeveloperTools(format) {
    const bundle = await rollup.rollup({
      input: path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-developer-tools', 'src', 'index.ts'),
      external: ['resize-observer-polyfill'],
      plugins: [
        rollupString({
          include: '**/*.raw.js',
        }),
        rollupTypescript({
          cacheRoot: path.join('node_modules', '.cache', 'rts2', format.target, format.module),
          tsconfig: format.tsconfigESM,
          tsconfigOverride: {
            compilerOptions: {
              inlineSources: false,
            },
          },
          check: false,
        }),
      ],
    });

    await bundle.write({
      format: format.module,
      file: path.join(getDest(format), 'neo-one-developer-tools', 'src', 'index.js'),
    });
  }))({});

const buildTypescript = ((cache) =>
  memoizeTask(cache, function buildTypescript(format, done, type) {
    return gulp.series(copyTypescript(format, type), compileTypescript(format, type))(done);
  }))({});

const buildAll = ((cache) =>
  memoizeTask(cache, function buildAll(format, done, type) {
    return gulp.parallel(
      ...[
        copyPkg(format),
        copyPkgFiles(format),
        copyTypes(format),
        copyFiles(format),
        copyRootPkg(format),
        copyRootTSConfig(format),
        compileDeveloperTools(format),
        buildTypescript(format, type),
        format === MAIN_FORMAT ? 'buildBin' : undefined,
        format === MAIN_FORMAT ? 'createBin' : undefined,
        format === MAIN_FORMAT ? 'copyBin' : undefined,
      ].filter((task) => task !== undefined),
    )(done);
  }))({});

const install = ((cache) =>
  memoizeTask(cache, async function install(format) {
    await execa.shell('yarn install --non-interactive --no-progress --ignore-engines', {
      cwd: getDistBaseCWD(format),
      stdio: ['ignore', 'inherit', 'inherit'],
    });
  }))({});

const publish = ((cache) =>
  memoizeTask(cache, async function publish(format) {
    await execa('yarn', ['lerna', 'exec', path.resolve(appRootDir.get(), 'scripts', 'try-publish')], {
      cwd: getDistBaseCWD(format),
      stdio: ['ignore', 'inherit', 'inherit'],
    });
  }))({});

const rootPkg = { ...pkg, devDependencies: { ...pkg.devDependencies } };
delete rootPkg.devDependencies.husky;
delete rootPkg.husky;
const copyRootPkg = ((cache) =>
  memoizeTask(cache, async function copyRootPkg(format) {
    const filePath = path.resolve(getDistBase(format), 'package.json');
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(rootPkg, null, 2));
  }))({});

const copyRootTSConfig = ((cache) =>
  memoizeTask(cache, async function copyRootTSConfig(format) {
    const tsconfigContents = await fs.readFile(path.resolve(appRootDir.get(), 'tsconfig.json'), 'utf8');
    const tsconfig = JSON.parse(tsconfigContents);
    const suffix = format === MAIN_FORMAT ? '' : `-${format.target}-${format.module}`;
    tsconfig.compilerOptions.paths = {
      '@neo-one/ec-key': ['../@types/@neo-one/ec-key'],
      '@neo-one/boa': ['../@types/@neo-one/boa'],
      '@neo-one/csharp': ['../@types/@neo-one/csharp'],
      [`@neo-one/*${suffix}`]: ['./neo-one-*/src'],
      '*': ['../@types/*'],
    };
    const filePath = path.resolve(getDistBase(format), 'tsconfig.json');
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(tsconfig, null, 2));
  }))({});

const gulpBin = () =>
  gulpReplaceModule(MAIN_FORMAT, gulp.src(globs.bin)).pipe(
    gulpRename((parsedPath) => {
      parsedPath.dirname = parsedPath.dirname.slice(0, -'/src/bin'.length) + '/bin';
    }),
  );

const binProject = ts.createProject(MAIN_BIN_FORMAT.tsconfig, { typescript });
const binBanner = `#!/usr/bin/env node
require('source-map-support').install({ handleUncaughtExceptions: false, environment: 'node' });
const { defaultMetrics, metrics } = require('@neo-one/monitor');
metrics.setFactory(defaultMetrics);
`;
gulp.task('compileBin', () =>
  gulpBin()
    .pipe(gulpSourcemaps.init())
    .pipe(binProject())
    .pipe(gulpBanner(binBanner))
    .pipe(gulpSourcemaps.mapSources(mapSources))
    .pipe(gulpSourcemaps.write())
    .pipe(gulp.dest(getDest(MAIN_FORMAT))),
);
const bin = (name) => `#!/usr/bin/env node
const importLocal = require('import-local');

if (!importLocal(__filename)) {
  const execa = require('execa');
  const path = require('path');
  const semver = require('semver');

  let args = [];
  if (semver.satisfies(process.version, '8.x')) {
    args = ['--harmony-async-iteration'];
  } else if (semver.satisfies(process.version, '9.x')) {
    args = ['--harmony'];
  }

  const proc = execa('node', args.concat([path.resolve(__dirname, '${name}')]).concat(process.argv.slice(2)), {
    stdio: 'inherit',
    env: {
      NODE_NO_WARNINGS: '1',
    },
  });
  process.on('SIGTERM', () => proc.kill('SIGTERM'));
  process.on('SIGINT', () => proc.kill('SIGINT'));
  process.on('SIGBREAK', () => proc.kill('SIGBREAK'));
  process.on('SIGHUP', () => proc.kill('SIGHUP'));
  proc.on('exit', (code, signal) => {
    let exitCode = code;
    if (exitCode === null) {
      exitCode = signal === 'SIGINT' ? 0 : 1;
    }
    process.exit(exitCode);
  });
}
`;
gulp.task('createBin', () =>
  gulp
    .src(globs.bin)
    .pipe(
      through2.obj(function(file, enc, callback) {
        file.dirname = file.dirname.slice(0, -'/src/bin'.length) + '/bin';
        file.extname = '';
        file.contents = Buffer.from(bin(`${path.basename(file.basename, '.ts')}.js`), 'utf8');

        this.push(file);

        callback();
      }),
    )
    .pipe(gulp.dest(getDest(MAIN_FORMAT))),
);
gulp.task('copyBin', () => gulpBin().pipe(gulp.dest(getDest(MAIN_FORMAT))));
gulp.task('buildBin', gulp.parallel('compileBin', 'createBin', 'copyBin'));

gulp.task('clean', () => fs.remove(DIST));
gulp.task('copyPkg', gulp.parallel(FORMATS.map((format) => copyPkg(format))));
gulp.task('copyPkgFiles', gulp.parallel(FORMATS.map((format) => copyPkgFiles(format))));
gulp.task('copyTypes', gulp.parallel(FORMATS.map((format) => copyTypes(format))));
gulp.task('copyMetadata', gulp.parallel(FORMATS.map((format) => copyMetadata(format))));
gulp.task('copyFiles', gulp.parallel(FORMATS.map((format) => copyFiles(format))));
gulp.task('copyRootPkg', gulp.parallel(FORMATS.map((format) => copyRootPkg(format))));
gulp.task('copyRootTSConfig', gulp.parallel(FORMATS.map((format) => copyRootTSConfig(format))));
gulp.task('compileDeveloperTools', gulp.parallel(FORMATS.map((format) => compileDeveloperTools(format))));
gulp.task('buildTypescript', gulp.parallel(FORMATS.map((format) => buildTypescript(format))));
gulp.task(
  'buildAll',
  gulp.series('compileDeveloperToolsFrame', gulp.parallel(FORMATS.map((format) => buildAll(format)))),
);
gulp.task('install', gulp.parallel(FORMATS.map((format) => install(format))));
gulp.task('publish', gulp.parallel(FORMATS.map((format) => publish(format))));

gulp.task('build', gulp.series('clean', 'buildAll', 'install'));

const buildE2ESeries = (type) =>
  gulp.series('compileDeveloperToolsFrame', buildAll(MAIN_FORMAT, type), install(MAIN_FORMAT));
gulp.task('buildE2E', gulp.series('clean', buildE2ESeries()));

gulp.task(
  'watch',
  gulp.series(buildE2ESeries('fast'), function startWatch() {
    noCache = true;
    gulp.watch(globs.originalSrc, buildTypescript(MAIN_FORMAT, 'fast'));
    gulp.watch(globs.bin, gulp.series('buildBin'));
  }),
);

gulp.task('prepareRelease', async () => {
  await execa(
    'yarn',
    ['lerna', 'version', '--conventional-commits', '--npm-tag=latest', '--yes', '--message', 'chore(release): publish'],
    {
      stdio: ['ignore', 'inherit', 'inherit'],
    },
  );
});

gulp.task('test', async () => {
  await execa('yarn', ['test-ci'], { stdio: ['ignore', 'inherit', 'inherit'] });
});

gulp.task('e2e', async () => {
  await execa('yarn', ['e2e-ci'], { stdio: ['ignore', 'inherit', 'inherit'] });
});

gulp.task('release', gulp.series('test', 'build', 'e2e', 'prepareRelease', 'copyPkg', 'publish'));

gulp.task('fastRelease', gulp.series('build', 'prepareRelease', 'copyPkg', 'copyMetadata', 'copyPkgFiles', 'publish'));
