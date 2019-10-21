import * as fs from 'fs-extra';
import * as path from 'path';
import yargs from 'yargs';

const argv = yargs
  .boolean('full')
  .describe('full', 'flag for also cleaning lib/* and package-deps.json')
  .default('full', false)
  .boolean('debug')
  .describe('debug', 'flag for logging actions')
  .default('debug', false).argv;

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const PACKAGES_DIR = path.resolve(APP_ROOT_DIR, 'packages');

const getLogger = (debug: boolean = false) =>
  debug
    ? (input: string | readonly string[]) => console.log(input)
    : (_input: string | readonly string[]) => {
        /* do nothing */
      };

const debug = getLogger(argv.debug);

const packagesToScan: readonly string[] = fs
  .readdirSync(PACKAGES_DIR)
  .filter((dir) => dir !== '.DS_Store')
  .map((dir) => path.join(PACKAGES_DIR, dir));

debug('Packages being scanned:');
debug(packagesToScan);

const deleteAll = (modules: readonly string[]): void => {
  modules.forEach((dir) => {
    if (argv.full) {
      debug(`Removing package-deps: ${path.resolve(dir, 'package-deps.json')}`);
      fs.removeSync(path.resolve(dir, 'package-deps.json'));
      debug(`Removing /lib: ${path.resolve(dir, 'lib')}`);
      fs.removeSync(path.resolve(dir, 'lib'));
    }
    const filesInPackage = fs.readdirSync(dir);
    filesInPackage.forEach((file) => {
      if (file.includes('.log')) {
        debug(`Removing log file: ${path.resolve(dir, file)}`);
        fs.removeSync(path.resolve(dir, file));
      }
    });
  });
  console.log('Done cleaning.');
};

deleteAll(packagesToScan);
