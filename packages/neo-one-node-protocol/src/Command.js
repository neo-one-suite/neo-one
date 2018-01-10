/* @flow */
import { CustomError } from '@neo-one/utils';

export type Command =
  | 'addr'
  | 'block'
  | 'consensus'
  | 'filteradd'
  | 'filterclear'
  | 'filterload'
  | 'getaddr'
  | 'getblocks'
  | 'getdata'
  | 'getheaders'
  | 'headers'
  | 'inv'
  | 'mempool'
  | 'tx'
  | 'verack'
  | 'version'
  | 'alert'
  | 'merkleblock'
  | 'notfound'
  | 'ping'
  | 'pong'
  | 'reject';

export const COMMAND = {
  ADDR: 'addr',
  BLOCK: 'block',
  CONSENSUS: 'consensus',
  FILTER_ADD: 'filteradd',
  FILTER_CLEAR: 'filterclear',
  FILTER_LOAD: 'filterload',
  GET_ADDR: 'getaddr',
  GET_BLOCKS: 'getblocks',
  GET_DATA: 'getdata',
  GET_HEADERS: 'getheaders',
  HEADERS: 'headers',
  INV: 'inv',
  MEMPOOL: 'mempool',
  TX: 'tx',
  VERACK: 'verack',
  VERSION: 'version',
  ALERT: 'alert',
  MERKLE_BLOCK: 'merkleblock',
  NOT_FOUND: 'notfound',
  PING: 'ping',
  PONG: 'pong',
  REJECT: 'reject',
};

export class InvalidCommandError extends CustomError {
  command: string;
  code: string;

  constructor(command: string) {
    super(`Expected command, found: ${command}`);
    this.command = command;
    this.code = 'INVALID_COMMAND';
  }
}

export const assertCommand = (command: string): Command => {
  switch (command) {
    case 'addr':
      return COMMAND.ADDR;
    case 'block':
      return COMMAND.BLOCK;
    case 'consensus':
      return COMMAND.CONSENSUS;
    case 'filteradd':
      return COMMAND.FILTER_ADD;
    case 'filterclear':
      return COMMAND.FILTER_CLEAR;
    case 'filterload':
      return COMMAND.FILTER_LOAD;
    case 'getaddr':
      return COMMAND.GET_ADDR;
    case 'getblocks':
      return COMMAND.GET_BLOCKS;
    case 'getdata':
      return COMMAND.GET_DATA;
    case 'getheaders':
      return COMMAND.GET_HEADERS;
    case 'headers':
      return COMMAND.HEADERS;
    case 'inv':
      return COMMAND.INV;
    case 'mempool':
      return COMMAND.MEMPOOL;
    case 'tx':
      return COMMAND.TX;
    case 'verack':
      return COMMAND.VERACK;
    case 'version':
      return COMMAND.VERSION;
    case 'alert':
      return COMMAND.ALERT;
    case 'merkleblock':
      return COMMAND.MERKLE_BLOCK;
    case 'notfound':
      return COMMAND.NOT_FOUND;
    case 'ping':
      return COMMAND.PING;
    case 'pong':
      return COMMAND.PONG;
    case 'reject':
      return COMMAND.REJECT;
    default:
      throw new InvalidCommandError(command);
  }
};
