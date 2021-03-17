import { BinaryReader } from './BinaryReader';
import { InvalidScriptError } from './errors';
import { assertByteCode, Byte, Op } from './models';
import { assertStackItemType, StackItemType } from './StackItemType';

export const getOperands = (instruction: Buffer): readonly number[] => {
  const reader = new BinaryReader(instruction);
  const opCode = reader.readUInt8();
  assertByteCode(opCode);

  switch (opCode) {
    case Op.JMP:
    case Op.JMPIF:
    case Op.JMPIFNOT:
    case Op.JMPEQ:
    case Op.JMPNE:
    case Op.JMPGT:
    case Op.JMPLT:
    case Op.JMPGE:
    case Op.JMPLE:
    case Op.CALL:
    case Op.ENDTRY:
      return [reader.readInt8()];
    case Op.JMP_L:
    case Op.JMPIF_L:
    case Op.JMPIFNOT_L:
    case Op.JMPEQ_L:
    case Op.JMPNE_L:
    case Op.JMPGT_L:
    case Op.JMPLT_L:
    case Op.JMPGE_L:
    case Op.JMPLE_L:
    case Op.CALL_L:
    case Op.ENDTRY_L:
    case Op.PUSHA:
      return [reader.readInt32LE()];
    case Op.TRY:
      return [reader.readInt8(), reader.readInt8()];
    case Op.TRY_L:
      return [reader.readInt32LE(), reader.readInt32LE()];
    default:
      return [];
  }
};

export const getInstructionSize = (script: Buffer) => {
  const opCodeSizeInBytes = 1;
  const reader = new BinaryReader(script);
  const opCode = Byte[assertByteCode(reader.readUInt8())];

  if (variableOperandSize[opCode] !== undefined) {
    const variableSize = variableOperandSize[opCode] as number;
    let size = 0;
    if (variableSize === 1) {
      size = reader.readUInt8();
    }
    if (variableSize === 2) {
      size = reader.readInt16LE();
    }
    if (variableSize === 4) {
      size = reader.readInt32LE();
    }

    return opCodeSizeInBytes + variableSize + size;
  }

  if (operandSize[opCode] !== undefined) {
    const opSize = operandSize[opCode] as number;

    return opSize + opCodeSizeInBytes;
  }

  return opCodeSizeInBytes;
};

export const variableOperandSize: { readonly [key: string]: Op | undefined } = {
  PUSHDATA1: 1,
  PUSHDATA2: 2,
  PUSHDATA4: 4,
};

export const operandSize: { readonly [key: string]: Op | undefined } = {
  PUSHINT8: 1,
  PUSHINT16: 2,
  PUSHINT32: 4,
  PUSHINT64: 8,
  PUSHINT128: 16,
  PUSHINT256: 32,
  PUSHA: 4,
  JMP: 1,
  JMP_L: 4,
  JMPIF: 1,
  JMPIF_L: 4,
  JMPIFNOT: 1,
  JMPIFNOT_L: 4,
  JMPEQ: 1,
  JMPEQ_L: 4,
  JMPNE: 1,
  JMPNE_L: 4,
  JMPGT: 1,
  JMPGT_L: 4,
  JMPGE: 1,
  JMPGE_L: 4,
  JMPLT: 1,
  JMPLT_L: 4,
  JMPLE: 1,
  JMPLE_L: 4,
  CALL: 1,
  CALL_L: 4,
  CALLT: 2,
  TRY: 2,
  TRY_L: 8,
  ENDTRY: 1,
  ENDTRY_L: 4,
  SYSCALL: 4,
  INITSSLOT: 1,
  INITSLOT: 2,
  LDSFLD: 1,
  STSFLD: 1,
  LDLOC: 1,
  STLOC: 1,
  LDARG: 1,
  STARG: 1,
  NEWARRAY_T: 1,
  ISTYPE: 1,
  CONVERT: 1,
};

export const assertValidScript = (script: Buffer) => {
  const instructionDict = new Map<number, Buffer>();
  let ip = 0;
  // tslint:disable-next-line: no-loop-statement
  while (ip < script.length) {
    const instructionSize = getInstructionSize(script.slice(ip));
    instructionDict.set(ip, script.slice(ip, ip + instructionSize));
    ip += instructionSize;
  }

  instructionDict.forEach((instruction, ipIn) => {
    const reader = new BinaryReader(instruction);
    const opCodeNum = assertByteCode(reader.readUInt8());
    const opCodeString = Byte[opCodeNum];

    // tslint:disable-next-line: prefer-switch
    if (opCodeNum === Op.NEWARRAY_T || opCodeNum === Op.ISTYPE || opCodeNum === Op.CONVERT) {
      const type = assertStackItemType(reader.readUInt8());
      if (type === StackItemType.Any && opCodeNum !== Op.NEWARRAY_T) {
        throw new InvalidScriptError(opCodeString, ipIn);
      }
    }

    const tokens = getOperands(instruction);

    tokens.forEach((token) => {
      if (!instructionDict.has(ipIn + token)) {
        throw new InvalidScriptError(opCodeString, ipIn);
      }
    });
  });
};
