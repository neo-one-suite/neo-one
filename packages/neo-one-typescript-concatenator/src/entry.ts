import * as fs from 'fs-extra';
import * as path from 'path';
import yargs from 'yargs';
import { concatenate } from './concatenate';

yargs.describe('entry', 'Entry file path.');
yargs.describe('output', 'Output file path.');

const result = concatenate(yargs.argv.entry);
fs.ensureDirSync(path.dirname(yargs.argv.output));
fs.writeFileSync(yargs.argv.output, result);
