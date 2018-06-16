import { checkServer } from './checkServer';
import { reset } from './reset';
import { startServer } from './startServer';
import { stopServer } from './stopServer';
import { version } from './version';
// tslint:disable-next-line export-name readonly-array
export const commands = [checkServer, reset, startServer, stopServer, version];
