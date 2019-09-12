// tslint:disable
import fs from 'fs-extra';
import gulp from 'gulp';
import { Format, getFormat } from './formats';
import { buildBin, buildTypescript, rollupDevTools, CompileTypescriptOptions } from './builds';
import yargs from 'yargs';
import { getPackageInfo } from './utils';
import { pack, copyData, packBin } from './pack';

const defaultBuildFormat = process.env.NEO_ONE_BUILD_FORMAT !== undefined ? process.env.NEO_ONE_BUILD_FORMAT : 'main';

const { argv } = yargs
  .string('format')
  .describe('format', 'specify an output library format')
  .choices('format', ['main', 'next', 'browserify'])
  .default('format', defaultBuildFormat);

const ignoreGlobs = [
  '!src/__tests__/**/*',
  '!src/__e2e__/**/*',
  '!src/__data__/**/*',
  '!src/__ledger_tests__/**/*',
  '!src/__other_tests__/**/*',
  '!src/bin/**/*',
];

class BuildTask<Options = undefined> {
  public enabled: boolean;
  public glob: string[];
  public options: Options | undefined;
  public buildFormatFunction: (
    format: Format,
    pkgName: string,
    dependencies: string[],
  ) => (glob: string[], options?: Options) => Promise<void> | void;
  private packageInfo: Promise<{ readonly name: string; readonly dependencies: string[] }>;

  constructor(
    fn: (
      format: Format,
      pkgName: string,
      dependencies: string[],
    ) => (glob: string[], options?: Options) => Promise<void> | void,
    initGlob?: string[],
  ) {
    this.packageInfo = getPackageInfo();
    this.enabled = true;
    this.glob = initGlob ? initGlob : [];
    this.buildFormatFunction = fn;
  }

  public async execute(format: Format) {
    const { name, dependencies } = await this.packageInfo;
    if (this.enabled) {
      const buildFunction = this.buildFormatFunction(format, name, dependencies);
      const executed = Promise.resolve(buildFunction(this.glob, this.options));
      return executed;
    }
  }

  public addGlobPattern(pattern: string) {
    this.glob = this.glob.concat(pattern);
  }
}

interface CopyStaticOptions {
  readonly dest: string;
}
export const copyStaticTask = new BuildTask<CopyStaticOptions>(
  () => (glob, options) => {
    gulp.src(glob, { nodir: true }).pipe(gulp.dest(options !== undefined ? options.dest : 'lib'));
  },
  ['src/**/*'].concat(ignoreGlobs),
);
copyStaticTask.enabled = false;

export const compileTypescriptTask = new BuildTask<CompileTypescriptOptions>(
  buildTypescript,
  ['src/**/*.ts', 'src/**/*.tsx'].concat(ignoreGlobs),
);

export const cleanTask = async () => Promise.all([fs.remove('lib')]);

export const rollupToolsTask = new BuildTask(rollupDevTools, []);
rollupToolsTask.enabled = false;

export const compileBinTask = new BuildTask(buildBin);

export const copyDataTask = new BuildTask<undefined>(copyData);

export const packTask = new BuildTask<undefined>(pack, ['lib/**', '!lib/**/*.map']);

export const packBinTask = new BuildTask<undefined>(packBin);

export const initialize = () => {
  const format = getFormat(argv.format);

  gulp.task('clean', async () => {
    await fs.remove('lib').then(() => fs.ensureDir('lib'));
  });

  gulp.task('copyStatic', async () => {
    await copyStaticTask.execute(format);
  });

  gulp.task('compileTS', async () => {
    await compileTypescriptTask.execute(format);
  });

  gulp.task('compileBin', async () => {
    await compileBinTask.execute(format);
  });

  gulp.task('rollupTools', async () => {
    await rollupToolsTask.execute(format);
  });

  gulp.task('copyData', async () => {
    await copyDataTask.execute(format);
  });

  gulp.task('pack', async () => {
    await packTask.execute(format);
  });

  gulp.task('packBin', async () => {
    await packBinTask.execute(format);
  });

  gulp.task('default', gulp.series('clean', 'copyStatic', 'compileTS', 'compileBin', 'rollupTools'));

  gulp.task('pack', gulp.series('copyData', 'pack', 'packBin'));
};
