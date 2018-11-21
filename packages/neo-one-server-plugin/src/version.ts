import * as fs from 'fs-extra';
import * as path from 'path';

// tslint:disable-next-line export-name
export const VERSION = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8')).version;
