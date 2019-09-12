import fs from 'fs-extra';
// tslint:disable-next-line: match-default-export-name
import minimatch from 'minimatch';
import path from 'path';
import { Configuration, Linter, LintResult } from 'tslint';
import yargs from 'yargs';

const argv = yargs
  .boolean('staged')
  .describe('staged', 'flag for lint-staged')
  .default('staged', false)
  .string('pattern')
  .describe('pattern', 'glob-file pattern to lint')
  .default('pattern', 'src/**/*.ts?(x)').argv;

const CWD = process.cwd();
const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');
const TSLINT_CONFIG = path.resolve(APP_ROOT_DIR, 'tslint.json');

export const writeReport = (report: LintResult) => {
  if (report.errorCount !== 0 || report.warningCount !== 0) {
    if (argv.staged) {
      throw report.output;
    }
    process.stderr.write(`${report.output}\n`);
  }
};

export const lint = () => {
  const configuration = Configuration.findConfiguration(TSLINT_CONFIG).results;
  if (configuration === undefined) {
    throw new Error(`undefined configuration found: ${configuration}`);
  }

  const options = {
    fix: false,
    formatter: 'codeFrame',
    rulesDirectory: configuration.rulesDirectory,
  };
  const maybeTSConfigLint = path.resolve(CWD, 'tsconfig.lint.json');
  const tsconfigPath = fs.existsSync(maybeTSConfigLint) ? maybeTSConfigLint : path.resolve(CWD, 'tsconfig.json');
  const program = Linter.createProgram(tsconfigPath);
  const linter = new Linter(options, program);

  const programFiles = Linter.getFileNames(program);
  const files = minimatch.match(programFiles, path.resolve(CWD, argv.pattern), { matchBase: true });
  files.forEach((file) => {
    const maybeFileContents = program.getSourceFile(file);
    if (maybeFileContents === undefined) {
      throw new Error(`got bad sourcefile for ${file}`);
    }
    const fileContents = maybeFileContents.getFullText();

    linter.lint(file, fileContents, configuration);
  });

  const results = linter.getResult();

  writeReport(results);
};
