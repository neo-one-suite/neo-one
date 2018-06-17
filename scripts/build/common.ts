// tslint:disable no-console
import * as appRootDir from 'app-root-dir';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import {
  OutputOptions,
  rollup,
  RollupSingleFileBuild,
  RollupWatchOptions,
  watch,
  Watcher,
  WatcherOptions,
} from 'rollup';
// @ts-ignore
import * as babel from 'rollup-plugin-babel';
// @ts-ignore
import * as json from 'rollup-plugin-json';
// @ts-ignore
import * as resolve from 'rollup-plugin-node-resolve';
// @ts-ignore
import * as replace from 'rollup-plugin-replace';
// @ts-ignore
import * as sourcemaps from 'rollup-plugin-sourcemaps';
// @ts-ignore
import * as typescript from 'rollup-plugin-typescript2';
import * as ts from 'typescript';

import getBabelConfig from '../getBabelConfig';

export enum Format {
  cjs = 'cjs',
  es = 'es',
}
export enum Entry {
  node = 'node',
  browser = 'browser',
}

// tslint:disable-next-line readonly-array
const getPackagePath = (pkg: string, ...parts: string[]) => path.resolve(appRootDir.get(), 'packages', pkg, ...parts);

const getPackageJSON = (pkg: string) => JSON.parse(fs.readFileSync(getPackagePath(pkg, 'package.json'), 'utf-8'));

const pkgs = fs
  .readdirSync('packages')
  .filter((file) => !file.startsWith('.'))
  .filter((pkg) => fs.pathExistsSync(getPackagePath(pkg, 'package.json')))
  .filter((pkg) => !getPackageJSON(pkg).noCompile);

const builtIns: ReadonlyArray<string> = [
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
];

const dependencies = [
  ...new Set(
    pkgs.reduce<ReadonlyArray<string>>((acc, pkg) => {
      const deps = getPackageJSON(pkg).dependencies;

      return acc.concat(Object.keys(deps === undefined ? {} : deps));
    }, []),
  ),
].concat(builtIns);

const updateCompilerOptions = (pkg: string, compilerOptions: object) => ({
  ...compilerOptions,
  rootDirs: pkgs.map((subPkg) => getPackagePath(subPkg, 'src')),
  baseUrl: getPackagePath(pkg, 'src'),
  target: 'esnext',
  module: 'esnext',
  moduleResolution: 'node',
  noEmit: false,
  paths: {
    '@neo-one/ec-key': ['../../../@types/@neo-one/ec-key'],
    '@neo-one/*': ['../../neo-one-*/src'],
    '*': ['../../../@types/*'],
  },
  typeRoots: [
    getPackagePath(pkg, '..', '..', 'node_modules', '@types'),
    getPackagePath(pkg, '..', '..', '@types', 'roots'),
  ],
  plugins: [],
});

const getCompilerOptions = (pkg: string) => {
  const configPath = getPackagePath(pkg, 'tsconfig.json');
  const res = ts.readConfigFile(configPath, (value) => fs.readFileSync(value, 'utf8'));
  const parseConfigHost = {
    fileExists: fs.pathExistsSync,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
    useCaseSensitiveFileNames: true,
  };
  const { options } = ts.parseJsonConfigFileContent(res.config, parseConfigHost, path.dirname(configPath));

  return updateCompilerOptions(pkg, options);
};

interface EntryOutput {
  readonly format: Format;
  readonly output: string;
  readonly banner?: string;
}

interface EntryConfig {
  readonly entry: Entry;
  readonly input: string;
  readonly includeDeps: boolean;
  readonly outputs: ReadonlyArray<EntryOutput>;
  readonly useBuiltIns?: string | boolean;
}

const getBinConfigs = async (pkg: string): Promise<ReadonlyArray<EntryConfig>> => {
  const binPath = getPackagePath(pkg, 'src', 'bin');
  const existsBin = await fs.pathExists(binPath);
  if (existsBin) {
    const files = await fs.readdir(binPath);

    return files.map((file) => ({
      entry: Entry.node,
      input: path.resolve(binPath, file),
      // Should we include deps? What about polyfills?
      includeDeps: false,
      useBuiltIns: 'entry',
      outputs: [
        {
          format: Format.cjs,
          output: getPackagePath(pkg, 'dist', 'bin', path.basename(file, '.ts')),
          banner: '#!/usr/bin/env node',
        },
      ],
    }));
  }

  return [];
};

const getEntries = async (pkg: string): Promise<ReadonlyArray<EntryConfig>> => {
  const dir = getPackagePath(pkg, 'src');
  const index = path.join(dir, 'index.ts');
  const [existsIndex, existsIndexBrowser, binConfigs] = await Promise.all([
    fs.pathExists(path.join(dir, 'index.ts')),
    fs.pathExists(path.join(dir, 'index.browser.ts')),
    getBinConfigs(pkg),
  ]);
  let result = binConfigs;
  const outputDir = getPackagePath(pkg, 'dist');
  if (existsIndex) {
    result = result.concat([
      {
        entry: Entry.node,
        input: index,
        includeDeps: false,
        outputs: [
          {
            format: Format.cjs,
            output: path.resolve(outputDir, 'index.js'),
          },
          {
            format: Format.es,
            output: path.resolve(outputDir, 'index.mjs'),
          },
        ],
      },
    ]);
  }
  if (existsIndexBrowser) {
    result = result.concat([
      {
        entry: Entry.browser,
        input: index,
        includeDeps: false,
        outputs: [
          {
            format: Format.cjs,
            output: path.resolve(outputDir, 'index.browser.js'),
          },
          {
            format: Format.es,
            output: path.resolve(outputDir, 'index.browser.mjs'),
          },
        ],
      },
    ]);
  }

  return result;
};

const getBabelConfigFull = ({
  modules,
  entry,
  useBuiltIns,
}: {
  readonly modules: boolean | string;
  readonly entry: Entry;
  readonly useBuiltIns?: boolean | string;
}) => ({
  babelrc: false,
  ...getBabelConfig({
    modules,
    useBuiltIns,
    targets: entry === 'node' ? { node: '10.4.1' } : { browsers: ['> 1%', 'last 2 versions', 'not ie <= 10'] },
  }),
});

const createRollupInput = ({ pkg, entry }: { readonly pkg: string; readonly entry: EntryConfig }) => ({
  input: entry.input,
  external: (module: string) =>
    (entry.includeDeps && builtIns.some((dep) => dep !== pkg && module.startsWith(dep))) ||
    (!entry.includeDeps && dependencies.some((dep) => dep !== pkg && module.startsWith(dep))),
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
    // @ts-ignore
    typescript({
      tsconfigOverride: {
        compilerOptions: getCompilerOptions(pkg),
        include: [getPackagePath(pkg, 'src')],
      },
      check: false,
      clean: true,
      typescript: ts,
    }),
    babel({
      exclude: path.join('node_modules', '**'),
      ...getBabelConfigFull({ modules: false, entry: entry.entry, useBuiltIns: entry.useBuiltIns }),
    }),
    sourcemaps(),
  ],
});

const createRollupOutput = ({
  pkg,
  output,
}: {
  readonly pkg: string;
  readonly output: EntryOutput;
}): OutputOptions => ({
  file: output.output,
  format: output.format,
  name: pkg,
  sourcemap: process.env.NEO_ONE_BUILD_INLINE_SOURCEMAP === 'true' ? 'inline' : true,
  exports: 'named',
  banner: output.banner,
});

const writeBundle = async ({
  pkg,
  bundle,
  output,
}: {
  readonly pkg: string;
  readonly bundle: RollupSingleFileBuild;
  readonly output: EntryOutput;
}) => {
  await bundle.write(createRollupOutput({ pkg, output }));
};

const writeBundles = async ({
  pkg,
  bundle,
  entry,
}: {
  readonly pkg: string;
  readonly bundle: RollupSingleFileBuild;
  readonly entry: EntryConfig;
}) => {
  await Promise.all(
    entry.outputs.map(async (output) =>
      writeBundle({
        pkg,
        bundle,
        output,
      }),
    ),
  );
};

const rollupJavascript = async ({ pkg, entry }: { readonly pkg: string; readonly entry: EntryConfig }) => {
  const bundle = await rollup(createRollupInput({ pkg, entry }));

  await writeBundles({ pkg, bundle, entry });
};

export const compileJavascript = async ({ pkg }: { readonly pkg: string }): Promise<void> => {
  const start = Date.now();
  const entries = await getEntries(pkg);
  await Promise.all(entries.map(async (entry) => rollupJavascript({ pkg, entry })));
  console.log(`Built ${pkg} in ${((Date.now() - start) / 1000).toFixed(2)} seconds`);
};

export const buildJavascript = async () => {
  // tslint:disable-next-line no-loop-statement
  for (const pkg of pkgs) {
    await compileJavascript({ pkg });
  }
};

const createRollupWatch = ({ pkg }: { readonly pkg: string }): WatcherOptions => ({
  include: [path.join('packages', pkg, 'src', '**')],
});
const createWatchConfig = ({
  pkg,
  entry,
}: {
  readonly pkg: string;
  readonly entry: EntryConfig;
}): RollupWatchOptions => ({
  ...createRollupInput({ pkg, entry }),
  // tslint:disable-next-line no-any no-map-without-usage
  output: entry.outputs.map((output) => createRollupOutput({ pkg, output })) as any,
  watch: createRollupWatch({ pkg }),
});

const startWatcher = async (pkg: string, watcher: Watcher): Promise<void> =>
  new Promise<void>((promiseResolve) => {
    let resolved = false;
    const doResolve = () => {
      if (!resolved) {
        resolved = true;
        promiseResolve();
      }
    };

    watcher.on('event', (event) => {
      // tslint:disable-next-line prefer-switch
      if (event.code === 'BUNDLE_START') {
        console.log(`Building ${pkg}...`);
      } else if (event.code === 'BUNDLE_END') {
        console.log(`${pkg} done.`);
        doResolve();
      } else if (event.code === 'ERROR') {
        console.log(`${pkg} error.`);
        console.log(event);
        doResolve();
      }
    });
  });

export const watchJavascript = async () => {
  const watchConfigss = await Promise.all(
    pkgs.map<Promise<Array<[string, RollupWatchOptions]>>>(async (pkg) => {
      const entries = await getEntries(pkg);

      return entries.map<[string, RollupWatchOptions]>((entry) => [pkg, createWatchConfig({ pkg, entry })]);
    }),
  );

  // tslint:disable-next-line no-loop-statement
  for (const [pkg, watchConfig] of _.flatten<[string, RollupWatchOptions]>(watchConfigss)) {
    await startWatcher(pkg, watch([watchConfig]));
  }
};
