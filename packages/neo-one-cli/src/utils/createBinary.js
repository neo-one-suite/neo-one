/* @flow */
import type { Binary } from '@neo-one/server-plugin';

import {
  STATIC_NEO_ONE_OPTION,
  DIR_OPTION,
  SERVER_PORT_OPTION,
  MIN_PORT_OPTION,
} from '../constants';

export default (
  argv: Array<string>,
  {
    dir,
    serverPort,
    minPort,
  }: {|
    dir?: string,
    serverPort?: number,
    minPort?: number,
  |},
): Binary => {
  const [cmd] = argv;
  const firstArgs = [argv[1], STATIC_NEO_ONE_OPTION];
  if (dir != null) {
    firstArgs.push(DIR_OPTION);
    firstArgs.push(dir);
  }

  if (serverPort != null) {
    firstArgs.push(SERVER_PORT_OPTION);
    firstArgs.push(`${serverPort}`);
  }

  if (minPort != null) {
    firstArgs.push(MIN_PORT_OPTION);
    firstArgs.push(`${minPort}`);
  }

  return { cmd, firstArgs };
};
