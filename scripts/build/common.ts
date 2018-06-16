import * as appRootDir from 'app-root-dir';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { OutputOptions, rollup, RollupSingleFileBuild, RollupWatchOptions, watch, WatcherOptions } from 'rollup';
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

interface EntryConfig {
  readonly entry: Entry;
  readonly input: string;
  readonly includeDeps: boolean;
  readonly outputs: ReadonlyArray<{
    readonly format: Format;
    readonly output: string;
  }>;
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
      outputs: [
        {
          format: Format.cjs,
          output: getPackagePath('dist', 'bin', path.basename(file)),
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
  const outputDir = getPackagePath(pkg, 'dit');
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
            output: path.resolve(outputDir, 'index.es.js'),
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
            output: path.resolve(outputDir, 'index.browser.es.js'),
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
    targets: entry === 'node' ? { node: '8.9.0' } : { browsers: ['> 1%', 'last 2 versions', 'not ie <= 10'] },
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
      },
      check: false,
    }),
    babel({
      exclude: path.join('node_modules', '**'),
      ...getBabelConfigFull({ modules: false, entry: entry.entry }),
    }),
    sourcemaps(),
  ],
});

const createRollupOutput = ({
  pkg,
  format,
  file,
}: {
  readonly pkg: string;
  readonly format: Format;
  readonly file: string;
}): OutputOptions => ({
  file,
  format,
  name: pkg,
  sourcemap: process.env.NEO_ONE_BUILD_INLINE_SOURCEMAP === 'true' ? 'inline' : true,
  exports: 'named',
});

const writeBundle = async ({
  pkg,
  bundle,
  format,
  file,
}: {
  readonly pkg: string;
  readonly bundle: RollupSingleFileBuild;
  readonly format: Format;
  readonly file: string;
}) => {
  await bundle.write(createRollupOutput({ pkg, format, file }));
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
    entry.outputs.map(async ({ format, output }) =>
      writeBundle({
        pkg,
        bundle,
        format,
        file: output,
      }),
    ),
  );
};

const rollupJavascript = async ({ pkg, entry }: { readonly pkg: string; readonly entry: EntryConfig }) => {
  const bundle = await rollup(createRollupInput({ pkg, entry }));

  await writeBundles({ pkg, bundle, entry });
};

export const compileJavascript = async ({ pkg }: { readonly pkg: string }): Promise<void> => {
  const entries = await getEntries(pkg);
  await Promise.all(entries.map(async (entry) => rollupJavascript({ pkg, entry })));
};

export const buildJavascript = async () => {
  await Promise.all(pkgs.map(async (pkg) => compileJavascript({ pkg })));
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
  output: entry.outputs.map(({ format, output }) => createRollupOutput({ format, pkg, file: output })) as any,
  watch: createRollupWatch({ pkg }),
});

export const watchJavascript = async () => {
  const watchConfigss = await Promise.all(
    pkgs.map(async (pkg) => {
      const entries = await getEntries(pkg);

      return entries.map((entry) => createWatchConfig({ pkg, entry }));
    }),
  );
  const watcher = watch(_.flatten(watchConfigss));

  watcher.on('event', (event) => {
    // tslint:disable-next-line prefer-switch
    if (event.code === 'BUNDLE_START') {
      // tslint:disable-next-line no-console
      console.log('Building bundle...');
    } else if (event.code === 'BUNDLE_END') {
      // tslint:disable-next-line no-console
      console.log('Done.');
    } else if (event.code === 'ERROR') {
      // tslint:disable-next-line no-console
      console.log('Error.');
      // tslint:disable-next-line no-console
      console.log(event);
    }
  });
};
