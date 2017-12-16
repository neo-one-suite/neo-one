/* @flow */
import nuke from './nuke';
import start from './start';
import stop from './stop';
import version from './version';

export default start.concat(stop).concat([nuke, version]);
