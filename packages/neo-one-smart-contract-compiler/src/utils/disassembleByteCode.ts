// tslint:disable prefer-switch
import { Byte, isByteCode, Op, OpCode, toStackItemTypeJSON, toSysCallName, utils } from '@neo-one/client-common';
import { BinaryReader } from './BinaryReader';

export const createHexString = (bytes: Buffer): string => {
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

export const disassembleByteCode = (bytes: Buffer): readonly Line[] => {
  const reader = new BinaryReader(bytes);

  const signedBufferToString = (bytesLength: number) =>
    utils.fromSignedBuffer(reader.readBytes(bytesLength)).toString(10);

  const mutableResult: Array<readonly [number, OpCode | 'UNKNOWN', string | undefined]> = [];
  // tslint:disable-next-line no-loop-statement
  while (reader.hasMore()) {
    const pc = reader.index;
    const byte = reader.readUInt8();
    if (!isByteCode(byte)) {
      mutableResult.push([pc, 'UNKNOWN', undefined]);
      continue;
    }

    const pushData1 = byte === Op.PUSHDATA1;
    const pushData2 = byte === Op.PUSHDATA2;
    const pushData4 = byte === Op.PUSHDATA4;

    const opCode = Byte[byte];

    if (pushData1 || pushData2 || pushData4) {
      let numBytes;
      if (pushData1) {
        numBytes = reader.readUInt8();
      } else if (pushData2) {
        numBytes = reader.readUInt16LE();
      } else {
        numBytes = reader.readInt32LE();
      }
      mutableResult.push([pc, opCode, createHexString(reader.readBytes(numBytes))]);
    } else if (byte === Op.PUSHINT8) {
      mutableResult.push([pc, opCode, signedBufferToString(1)]);
    } else if (byte === Op.PUSHINT16) {
      mutableResult.push([pc, opCode, signedBufferToString(2)]);
    } else if (byte === Op.PUSHINT32) {
      mutableResult.push([pc, opCode, signedBufferToString(4)]);
    } else if (byte === Op.PUSHINT64) {
      mutableResult.push([pc, opCode, signedBufferToString(8)]);
    } else if (byte === Op.PUSHINT128) {
      mutableResult.push([pc, opCode, signedBufferToString(16)]);
    } else if (byte === Op.PUSHINT256) {
      mutableResult.push([pc, opCode, signedBufferToString(32)]);
    } else if (
      byte === Op.JMP ||
      byte === Op.JMPIF ||
      byte === Op.JMPIFNOT ||
      byte === Op.JMPEQ ||
      byte === Op.JMPNE ||
      byte === Op.JMPGT ||
      byte === Op.JMPLT ||
      byte === Op.JMPGE ||
      byte === Op.JMPLE ||
      byte === Op.CALL ||
      byte === Op.ENDTRY
    ) {
      mutableResult.push([pc, opCode, `${reader.readInt8()}`]);
    } else if (
      byte === Op.JMP_L ||
      byte === Op.JMPIF_L ||
      byte === Op.JMPIFNOT_L ||
      byte === Op.JMPEQ_L ||
      byte === Op.JMPNE_L ||
      byte === Op.JMPGT_L ||
      byte === Op.JMPLT_L ||
      byte === Op.JMPGE_L ||
      byte === Op.JMPLE_L ||
      byte === Op.CALL_L ||
      byte === Op.ENDTRY_L
    ) {
      mutableResult.push([pc, opCode, `${reader.readInt32LE()}`]);
    } else if (byte === Op.PUSHA) {
      mutableResult.push([pc, opCode, `${createHexString(reader.readBytes(4))}`]);
    } else if (
      byte === Op.LDSFLD ||
      byte === Op.STSFLD ||
      byte === Op.LDLOC ||
      byte === Op.STLOC ||
      byte === Op.LDARG ||
      byte === Op.STARG ||
      byte === Op.INITSSLOT
    ) {
      mutableResult.push([pc, opCode, `${reader.readUInt8()}`]);
    } else if (byte === Op.TRY) {
      const catchOffset = reader.readInt8();
      const finallyOffset = reader.readInt8();
      mutableResult.push([pc, opCode, `${catchOffset} ${finallyOffset}`]);
    } else if (byte === Op.TRY_L) {
      const catchOffset = reader.readInt32LE();
      const finallyOffset = reader.readInt32LE();
      mutableResult.push([pc, opCode, `${catchOffset} ${finallyOffset}`]);
    } else if (byte === Op.INITSLOT) {
      const localVarSlot = reader.readUInt8();
      const parametersCount = reader.readUInt8();
      mutableResult.push([pc, opCode, `${localVarSlot} ${parametersCount}`]);
    } else if (byte === Op.NEWARRAY_T || byte === Op.ISTYPE || byte === Op.CONVERT) {
      const type = reader.readUInt8();
      let typeString = `${type}`;
      try {
        typeString = toStackItemTypeJSON(type);
      } catch {
        // do nothing
      }
      mutableResult.push([pc, opCode, typeString]);
    } else if (byte === Op.SYSCALL) {
      const bytesOut = reader.readBytes(4);
      let result = createHexString(bytesOut);
      try {
        result = toSysCallName(bytesOut.readUInt32BE());
      } catch {
        // do nothing
      }
      mutableResult.push([pc, opCode, result]);
    } else {
      mutableResult.push([pc, opCode, undefined]);
    }
  }

  return mutableResult.map(([index, opCode, val]) => ({
    pc: index,
    value: `${index.toString().padStart(4, '0')}:${opCode}${val === undefined ? '' : ` ${val}`}`,
  }));
};
