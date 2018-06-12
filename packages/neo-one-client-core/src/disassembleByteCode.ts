import { Byte, Op, assertByteCode, OpCode } from './vm';
import { utils, BinaryReader } from './utils';

const createHexString = (bytes: Buffer): string => {
  let result = '';
  for (const byte of bytes) {
    result += `${byte.toString(16).padStart(2, '0')}`;
  }

  return `0x${result}`;
};

export default (bytes: Buffer): string[] => {
  const reader = new BinaryReader(bytes);

  const result: Array<[number, OpCode | 'UNKNOWN', string | null]> = [];
  while (reader.hasMore()) {
    const pc = reader.index;
    const byte = assertByteCode(reader.readUInt8());

    const pushBytes = byte >= Op.PUSHBYTES1 && byte <= Op.PUSHBYTES75;
    const pushData1 = byte === Op.PUSHDATA1;
    const pushData2 = byte === Op.PUSHDATA2;
    const pushData4 = byte === Op.PUSHDATA4;

    const opCode = Byte[byte];

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
      byte === Op.JMP ||
      byte === Op.JMPIF ||
      byte === Op.JMPIFNOT ||
      byte === Op.CALL
    ) {
      result.push([pc, opCode, `${reader.readInt16LE()}`]);
    } else if (byte === Op.APPCALL || byte === Op.TAILCALL) {
      const appBytes = [...reader.readBytes(20)];
      result.push([
        pc,
        opCode,
        createHexString(Buffer.from(appBytes.reverse())),
      ]);
    } else if (byte === Op.SYSCALL) {
      result.push([pc, opCode, utils.toASCII(reader.readVarBytesLE(252))]);
    } else if (Byte[byte] != null) {
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
