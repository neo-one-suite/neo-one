import { makeErrorWithCode } from '@neo-one/utils';

export enum Command {
  // Handshaking
  Version = 0x00,
  Verack = 0x01,

  // Connectivity
  GetAddr = 0x10,
  Addr = 0x11,
  Ping = 0x18,
  Pong = 0x19,

  // Synchronization
  GetHeaders = 0x20,
  Headers = 0x21,
  GetBlocks = 0x24,
  Mempool = 0x25,
  Inv = 0x27,
  GetData = 0x28,
  GetBlockByIndex = 0x29,
  NotFound = 0x2a,
  Transaction = 0x2b,
  Block = 0x2c,
  Consensus = 0x2d,
  Reject = 0x2f,

  // SPV Protocol
  FilterLoad = 0x30,
  FilterAdd = 0x31,
  FilterClear = 0x32,
  MerkleBlock = 0x38,

  // Others
  Alert = 0x40,
}

export const InvalidCommandError = makeErrorWithCode(
  'INVALID_COMMAND',
  (command: number) => `Invalid Command, found: ${command}`,
);

// tslint:disable-next-line: strict-type-predicates
const isCommand = (command: number): command is Command => Command[command] !== undefined;

export const assertCommand = (command: number): Command => {
  if (isCommand(command)) {
    return command;
  }

  throw new InvalidCommandError(command);
};

export type CommandJSON = keyof typeof Command;

export const InvalidCommandJSONError = makeErrorWithCode(
  'INVALID_COMMAND_JSON',
  (command: string) => `Invalid Command. Found: ${command}`,
);

const isCommandJSON = (command: string): command is CommandJSON =>
  // tslint:disable-next-line strict-type-predicates
  Command[command as keyof typeof Command] !== undefined;

export const assertCommandJSON = (command: string): CommandJSON => {
  if (isCommandJSON(command)) {
    return command;
  }

  throw new InvalidCommandJSONError(command);
};
