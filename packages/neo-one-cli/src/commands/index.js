/* @flow */
import checkServer from './checkServer';
import nuke from './nuke';
import startServer from './startServer';
import stopServer from './stopServer';
import version from './version';

export default [checkServer, nuke, startServer, stopServer, version];
