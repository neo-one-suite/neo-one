import * as fs from 'fs-extra';
import * as path from 'path';
import yargs from 'yargs';
import { concatenate } from './concatenate';

const argv = yargs
  .string('entry')
  .describe('entry', 'Entry file path.')
  .demandOption('entry')
  .string('output')
  .describe('output', 'Output file path.')
  .demandOption('output').argv;

const result = concatenate(argv.entry);
fs.ensureDirSync(path.dirname(argv.output));
fs.writeFileSync(argv.output, result);
