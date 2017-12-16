/* @flow */
import path from 'path';

const SERVER_PID = 'server.pid';

export default ({ dataPath }: {| dataPath: string |}) =>
  path.resolve(dataPath, SERVER_PID);
