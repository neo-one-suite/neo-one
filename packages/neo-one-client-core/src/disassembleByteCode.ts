// tslint:disable prefer-switch
import { BinaryReader, utils } from './utils';
import { assertByteCode, Byte, Op, OpCode } from './vm';

const createHexString = (bytes: Buffer): string => {
  let mutableResult = '';
  bytes.forEach((byte) => {
    mutableResult += `${byte.toString(16).padStart(2, '0')}`;
  });

  return `0x${mutableResult}`;
};

interface Line {
  readonly pc: number;
  readonly value: string;
}

export const disassembleByteCode = (bytes: Buffer): ReadonlyArray<Line> => {
  const reader = new BinaryReader(bytes);

  const mutableResult: Array<[number, OpCode | 'UNKNOWN', string | undefined]> = [];
  // tslint:disable-next-line no-loop-statement
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
      mutableResult.push([pc, opCode, createHexString(reader.readBytes(numBytes))]);
    } else if (byte === Op.JMP || byte === Op.JMPIF || byte === Op.JMPIFNOT || byte === Op.CALL) {
      mutableResult.push([pc, opCode, `${reader.readInt16LE()}`]);
    } else if (byte === Op.APPCALL || byte === Op.TAILCALL) {
      const mutableAppBytes = [...reader.readBytes(20)];
      mutableAppBytes.reverse();
      mutableResult.push([pc, opCode, createHexString(Buffer.from(mutableAppBytes))]);
    } else if (byte === Op.SYSCALL) {
      mutableResult.push([pc, opCode, utils.toASCII(reader.readVarBytesLE(252))]);
      // tslint:disable-next-line strict-type-predicate
    } else if (byte === Op.CALL_E || byte === Op.CALL_ET) {
      const returnValueCount = reader.readBytes(1);
      const parametersCount = reader.readBytes(1);
      const mutableAppBytes = [...reader.readBytes(20)];
      mutableAppBytes.reverse();
      mutableResult.push([
        pc,
        opCode,
        `${createHexString(returnValueCount)} ${createHexString(parametersCount)} ${createHexString(
          Buffer.from(mutableAppBytes),
        )}`,
      ]);
    } else if (byte === Op.CALL_ED || byte === Op.CALL_EDT || byte === Op.CALL_I) {
      const returnValueCount = reader.readBytes(1);
      const parametersCount = reader.readBytes(1);
      mutableResult.push([pc, opCode, `${createHexString(returnValueCount)} ${createHexString(parametersCount)}`]);
    } else {
      mutableResult.push([pc, opCode, undefined]);
    }
  }

  return mutableResult.map(([index, opCode, val]) => ({
    pc: index,
    value: `${index.toString().padStart(4, '0')}:${opCode}${val === undefined ? '' : ` ${val}`}`,
  }));
};
