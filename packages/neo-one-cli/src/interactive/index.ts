import { debug } from './debug';
import { version } from './version';

export { createPlugin } from './createPlugin';
// tslint:disable-next-line no-default-export
export default [debug, version];
