// tslint:disable no-array-mutation
import { Binary } from '@neo-one/server-plugin';
import { DIR_OPTION, MIN_PORT_OPTION, SERVER_PORT_OPTION, STATIC_NEO_ONE_OPTION } from '../constants';

export const createBinary = (
  argv: ReadonlyArray<string>,
  {
    dir,
    serverPort,
    minPort,
  }: {
    readonly dir?: string;
    readonly serverPort?: number;
    readonly minPort?: number;
  },
): Binary => {
  const [cmd] = argv;
  const firstArgs = [argv[1], STATIC_NEO_ONE_OPTION];
  if (dir !== undefined) {
    firstArgs.push(DIR_OPTION);
    firstArgs.push(dir);
  }

  if (serverPort !== undefined) {
    firstArgs.push(SERVER_PORT_OPTION);
    firstArgs.push(`${serverPort}`);
  }

  if (minPort !== undefined) {
    firstArgs.push(MIN_PORT_OPTION);
    firstArgs.push(`${minPort}`);
  }

  return { cmd, firstArgs };
};
