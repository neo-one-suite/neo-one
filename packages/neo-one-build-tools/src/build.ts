// tslint:disable
import fs from 'fs-extra';
import gulp from 'gulp';
import { MAIN_FORMAT, Format } from './formats';
import { buildBin, buildTypescript, rollupDevTools, CompileTypescriptOptions } from './builds';

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
  public buildFormatFunction: (format: Format) => (glob: string[], options?: Options) => Promise<void> | void;

  constructor(
    fn: (format: Format) => (glob: string[], options?: Options) => Promise<void> | void,
    initGlob?: string[],
  ) {
    this.enabled = true;
    this.glob = initGlob ? initGlob : [];
    this.buildFormatFunction = fn;
  }

  public async execute(format: Format) {
    if (this.enabled) {
      const buildFunction = this.buildFormatFunction(format);
      const executed = Promise.resolve(buildFunction(this.glob, this.options));
      await executed;
    }
  }

  public addGlobPattern(pattern: string) {
    this.glob = this.glob.concat(pattern);
  }
}

export const cleanTask = async (format: Format) => Promise.all([fs.remove(format.dist) /*fs.remove(BIN)*/]);

interface CopyStaticOptions {
  readonly dest: string;
}
export const copyStaticTask = new BuildTask<CopyStaticOptions>(
  (format) => (glob, options) => {
    gulp.src(glob, { nodir: true }).pipe(gulp.dest(options !== undefined ? options.dest : format.dist));
  },
  ['src/**/*'].concat(ignoreGlobs),
);

copyStaticTask.enabled = false;

export const compileTypescriptTask = new BuildTask<CompileTypescriptOptions>(
  buildTypescript,
  ['src/**/*.ts', 'src/**/*.tsx'].concat(ignoreGlobs),
);

export const rollupToolsTask = new BuildTask(rollupDevTools, []);

export const compileBinTask = new BuildTask(buildBin);

type BuildType = 'main' | 'tools';
export const initialize = (format: Format | BuildType = 'main') => {
  if (typeof format === 'string') {
    switch (format) {
      case 'main':
        gulp.task('default', async (done) => {
          await cleanTask(MAIN_FORMAT);
          await fs.ensureDir(MAIN_FORMAT.dist);
          await copyStaticTask.execute(MAIN_FORMAT);
          await compileTypescriptTask.execute(MAIN_FORMAT);
          await compileBinTask.execute(MAIN_FORMAT);
          done();
        });
        break;
      case 'tools':
        gulp.task('default', async (done) => {
          await cleanTask(MAIN_FORMAT);
          await fs.ensureDir(MAIN_FORMAT.dist);
          await compileTypescriptTask.execute(MAIN_FORMAT);
          await rollupToolsTask.execute(MAIN_FORMAT);
          done();
        });
        break;
      default:
        break;
    }
  } else {
    gulp.task('default', async (done) => {
      await cleanTask(format);
      await fs.ensureDir(format.dist);
      await copyStaticTask.execute(format);
      await compileTypescriptTask.execute(format);
      await compileBinTask.execute(format);
      done();
    });
  }
};
