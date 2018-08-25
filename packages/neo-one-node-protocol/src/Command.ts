import { makeErrorWithCode } from '@neo-one/utils';

export enum Command {
  addr = 'addr',
  block = 'block',
  consensus = 'consensus',
  filteradd = 'filteradd',
  filterclear = 'filterclear',
  filterload = 'filterload',
  getaddr = 'getaddr',
  getblocks = 'getblocks',
  getdata = 'getdata',
  getheaders = 'getheaders',
  headers = 'headers',
  inv = 'inv',
  mempool = 'mempool',
  tx = 'tx',
  verack = 'verack',
  version = 'version',
  alert = 'alert',
  merkleblock = 'merkleblock',
  notfound = 'notfound',
  ping = 'ping',
  pong = 'pong',
  reject = 'reject',
}

export const InvalidCommandError = makeErrorWithCode(
  'INVALID_COMMAND',
  (command: string) => `Invalid Command. Found: ${command}`,
);

const isCommand = (command: string): command is Command =>
  // tslint:disable-next-line strict-type-predicates no-any
  Command[command as any] !== undefined;

export const assertCommand = (command: string): Command => {
  if (isCommand(command)) {
    return command;
  }

  throw new InvalidCommandError(command);
};
