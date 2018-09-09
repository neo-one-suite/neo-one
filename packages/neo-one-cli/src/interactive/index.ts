import { debug } from './debug';
import { verify } from './verify';
import { version } from './version';

// tslint:disable-next-line export-name
export { createPlugin } from './createPlugin';
// tslint:disable-next-line export-name readonly-array
export const commands = [debug, verify, version];
