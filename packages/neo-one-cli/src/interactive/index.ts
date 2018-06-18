import { debug } from './debug';
import { version } from './version';

export { createPlugin } from './createPlugin';
// tslint:disable-next-line export-name readonly-array
export const commands = [debug, version];
