/* @flow */
import { BYTECODE_TO_OPCODE, OPCODE_TO_BYTECODE } from './vm';

import utils, { BinaryReader } from './utils';

const createHexString = (bytes: Buffer): string => {
  let result = '';
  for (const byte of bytes) {
    result += `${byte.toString(16).padStart(2, '0')}`;
  }

  return `0x${result}`;
};

export default (bytes: Buffer): Array<string> => {
  const reader = new BinaryReader(bytes);

  const result = [];
  while (reader.hasMore()) {
    const pc = reader.index;
    const byte = reader.readUInt8();

    const pushBytes =
      byte >= OPCODE_TO_BYTECODE.PUSHBYTES1 &&
      byte <= OPCODE_TO_BYTECODE.PUSHBYTES75;
    const pushData1 = byte === OPCODE_TO_BYTECODE.PUSHDATA1;
    const pushData2 = byte === OPCODE_TO_BYTECODE.PUSHDATA2;
    const pushData4 = byte === OPCODE_TO_BYTECODE.PUSHDATA4;

    const opCode = BYTECODE_TO_OPCODE[byte];

    if (pushBytes || pushData1 || pushData2 || pushData4) {
      let numBytes;
      if (pushBytes) {
        numBytes = byte;
      } else if (pushData1) {
        numBytes = reader.readUInt8();
      } else if (pushData2) {
        numBytes = reader.readUInt16LE();
      } else {
        numBytes = reader.readInt32LE();
      }
      result.push([pc, opCode, createHexString(reader.readBytes(numBytes))]);
    } else if (
      byte === OPCODE_TO_BYTECODE.JMP ||
      byte === OPCODE_TO_BYTECODE.JMPIF ||
      byte === OPCODE_TO_BYTECODE.JMPIFNOT ||
      byte === OPCODE_TO_BYTECODE.CALL
    ) {
      result.push([pc, opCode, `${reader.readInt16LE()}`]);
    } else if (
      byte === OPCODE_TO_BYTECODE.APPCALL ||
      byte === OPCODE_TO_BYTECODE.TAILCALL
    ) {
      const appBytes = [...reader.readBytes(20)];
      result.push([
        pc,
        opCode,
        createHexString(Buffer.from(appBytes.reverse())),
      ]);
    } else if (byte === OPCODE_TO_BYTECODE.SYSCALL) {
      result.push([pc, opCode, utils.toASCII(reader.readVarBytesLE(252))]);
    } else if (BYTECODE_TO_OPCODE[byte] != null) {
      result.push([pc, opCode, null]);
    } else {
      result.push([pc, 'UNKNOWN', byte.toString(16)]);
    }
  }

  return result.map(
    ([index, opCode, val]) =>
      `${index.toString().padStart(4, '0')}:${opCode}${
        val == null ? '' : ` ${val}`
      }`,
  );
};
