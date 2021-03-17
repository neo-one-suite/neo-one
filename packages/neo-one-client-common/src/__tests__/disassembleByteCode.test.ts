import { BN } from 'bn.js';
import { disassembleByteCode } from '../disassembleByteCode';
import { OpCode, ScriptBuilder, StackItemType } from '../index';

const noOpOps: ReadonlyArray<OpCode> = [
  'PUSHNULL',
  'PUSHM1',
  'PUSH0',
  'PUSH1',
  'PUSH2',
  'PUSH3',
  'PUSH4',
  'PUSH5',
  'PUSH6',
  'PUSH7',
  'PUSH8',
  'PUSH9',
  'PUSH10',
  'PUSH11',
  'PUSH12',
  'PUSH13',
  'PUSH14',
  'PUSH15',
  'PUSH16',
  'NOP',
  'CALLA',
  'ABORT',
  'ASSERT',
  'THROW',
  'ENDFINALLY',
  'RET',
  'DEPTH',
  'DROP',
  'NIP',
  'XDROP',
  'CLEAR',
  'DUP',
  'OVER',
  'PICK',
  'TUCK',
  'SWAP',
  'ROT',
  'ROLL',
  'REVERSE3',
  'REVERSE4',
  'REVERSEN',
  'LDSFLD0',
  'LDSFLD1',
  'LDSFLD2',
  'LDSFLD3',
  'LDSFLD4',
  'LDSFLD5',
  'LDSFLD6',
  'STSFLD0',
  'STSFLD1',
  'STSFLD2',
  'STSFLD3',
  'STSFLD4',
  'STSFLD5',
  'STSFLD6',
  'LDLOC0',
  'LDLOC1',
  'LDLOC2',
  'LDLOC3',
  'LDLOC4',
  'LDLOC5',
  'LDLOC6',
  'STLOC0',
  'STLOC1',
  'STLOC2',
  'STLOC3',
  'STLOC4',
  'STLOC5',
  'STLOC6',
  'LDARG0',
  'LDARG1',
  'LDARG2',
  'LDARG3',
  'LDARG4',
  'LDARG5',
  'LDARG6',
  'STARG0',
  'STARG1',
  'STARG2',
  'STARG3',
  'STARG4',
  'STARG5',
  'STARG6',
  'NEWBUFFER',
  'MEMCPY',
  'CAT',
  'SUBSTR',
  'LEFT',
  'RIGHT',
  'INVERT',
  'AND',
  'OR',
  'XOR',
  'EQUAL',
  'NOTEQUAL',
  'SIGN',
  'ABS',
  'NEGATE',
  'INC',
  'DEC',
  'ADD',
  'SUB',
  'MUL',
  'DIV',
  'MOD',
  'SHL',
  'SHR',
  'NOT',
  'BOOLAND',
  'BOOLOR',
  'NZ',
  'NUMEQUAL',
  'NUMNOTEQUAL',
  'LT',
  'LE',
  'GT',
  'GE',
  'MIN',
  'MAX',
  'WITHIN',
  'PACK',
  'UNPACK',
  'NEWARRAY0',
  'NEWARRAY',
  'NEWSTRUCT0',
  'NEWSTRUCT',
  'NEWMAP',
  'SIZE',
  'HASKEY',
  'KEYS',
  'VALUES',
  'PICKITEM',
  'APPEND',
  'SETITEM',
  'REVERSEITEMS',
  'REMOVE',
  'CLEARITEMS',
  'ISNULL',
  'POPITEM',
];

// tslint:disable-next-line: no-any
const myExpect = (script: Buffer, answer: string) => {
  const result = disassembleByteCode(script);
  expect(result[0].value.replace('0000:', '')).toEqual(answer);
};

describe('disassembleByteCode', () => {
  let sb: ScriptBuilder;
  beforeEach(() => {
    sb = new ScriptBuilder();
  });

  noOpOps.forEach((op) => {
    test(op, () => {
      myExpect(sb.emitOp(op).build(), op);
    });
  });

  test('NEWARRAY_T ByteString', () => {
    const script = sb.emitOp('NEWARRAY_T', Buffer.from([StackItemType.ByteString])).build();
    myExpect(script, 'NEWARRAY_T ByteString');
  });

  test('NEWARRAY_T Incorrect byte', () => {
    const script = sb.emitOp('NEWARRAY_T', Buffer.from([0xff])).build();
    myExpect(script, 'NEWARRAY_T 255');
  });
  test('ISTYPE ByteString', () => {
    const script = sb.emitOp('ISTYPE', Buffer.from([StackItemType.ByteString])).build();
    myExpect(script, 'ISTYPE ByteString');
  });

  test('ISTYPE Incorrect byte', () => {
    const script = sb.emitOp('ISTYPE', Buffer.from([0xff])).build();
    myExpect(script, 'ISTYPE 255');
  });

  test('CONVERT ByteString', () => {
    const script = sb.emitOp('CONVERT', Buffer.from([StackItemType.ByteString])).build();
    myExpect(script, 'CONVERT ByteString');
  });

  test('CONVERT Incorrect byte', () => {
    const script = sb.emitOp('CONVERT', Buffer.from([0xff])).build();
    myExpect(script, 'CONVERT 255');
  });

  test('PUSHINT8 -128', () => {
    const script = sb.emitPushInt(-128).build();
    myExpect(script, `PUSHINT8 ${-128}`);
  });

  test('PUSHINT8 127', () => {
    const script = sb.emitPushInt(127).build();
    myExpect(script, `PUSHINT8 ${127}`);
  });

  test('PUSHINT16 -32768', () => {
    const script = sb.emitPushInt(-32768).build();
    myExpect(script, `PUSHINT16 ${-32768}`);
  });

  test('PUSHINT16 32767', () => {
    const script = sb.emitPushInt(32767).build();
    myExpect(script, `PUSHINT16 ${32767}`);
  });

  test('PUSHINT32 -2147483648', () => {
    const script = sb.emitPushInt(-2147483648).build();
    myExpect(script, `PUSHINT32 ${-2147483648}`);
  });

  test('PUSHINT32 2147483647', () => {
    const script = sb.emitPushInt(2147483647).build();
    myExpect(script, `PUSHINT32 ${2147483647}`);
  });

  test('PUSHINT64 negative', () => {
    const bn = new BN(2).pow(new BN(64)).divn(-2);
    const script = sb.emitPushInt(bn).build();
    myExpect(script, `PUSHINT64 ${bn.toString()}`);
  });

  test('PUSHINT64 positive', () => {
    const bn = new BN(2).pow(new BN(64)).divn(2).subn(1);
    const script = sb.emitPushInt(bn).build();
    myExpect(script, `PUSHINT64 ${bn.toString()}`);
  });

  test('PUSHINT128 negative', () => {
    const bn = new BN(2).pow(new BN(128)).divn(-2);
    const script = sb.emitPushInt(bn).build();
    myExpect(script, `PUSHINT128 ${bn.toString()}`);
  });

  test('PUSHINT128 positive', () => {
    const bn = new BN(2).pow(new BN(128)).divn(2).subn(1);
    const script = sb.emitPushInt(bn).build();
    myExpect(script, `PUSHINT128 ${bn.toString()}`);
  });

  test('PUSHINT256 negative', () => {
    const bn = new BN(2).pow(new BN(256)).divn(-2);
    const script = sb.emitPushInt(bn).build();
    myExpect(script, `PUSHINT256 ${bn.toString()}`);
  });

  test('PUSHINT256 positive', () => {
    const bn = new BN(2).pow(new BN(256)).divn(2).subn(1);
    const script = sb.emitPushInt(bn).build();
    myExpect(script, `PUSHINT256 ${bn.toString()}`);
  });

  test('JMP', () => {
    const script = sb.emitOp('JMP', Buffer.from([0x3])).build();
    myExpect(script, 'JMP 3');
  });

  test('JMPIF', () => {
    const script = sb.emitOp('JMPIF', Buffer.from([0x3])).build();
    myExpect(script, 'JMPIF 3');
  });

  test('JMPIFNOT', () => {
    const script = sb.emitOp('JMPIFNOT', Buffer.from([0x3])).build();
    myExpect(script, 'JMPIFNOT 3');
  });

  test('JMPEQ', () => {
    const script = sb.emitOp('JMPEQ', Buffer.from([0x3])).build();
    myExpect(script, 'JMPEQ 3');
  });

  test('JMPNE', () => {
    const script = sb.emitOp('JMPNE', Buffer.from([0x3])).build();
    myExpect(script, 'JMPNE 3');
  });

  test('JMPGT', () => {
    const script = sb.emitOp('JMPGT', Buffer.from([0x3])).build();
    myExpect(script, 'JMPGT 3');
  });

  test('JMPLT', () => {
    const script = sb.emitOp('JMPLT', Buffer.from([0x3])).build();
    myExpect(script, 'JMPLT 3');
  });

  test('JMPGE', () => {
    const script = sb.emitOp('JMPGE', Buffer.from([0x3])).build();
    myExpect(script, 'JMPGE 3');
  });

  test('JMPLE', () => {
    const script = sb.emitOp('JMPLE', Buffer.from([0x3])).build();
    myExpect(script, 'JMPLE 3');
  });

  test('CALL', () => {
    const script = sb.emitOp('CALL', Buffer.from([0x3])).build();
    myExpect(script, 'CALL 3');
  });

  test('CALLT', () => {
    const script = sb.emitOp('CALLT', Buffer.from([0x0345])).build();
    myExpect(script, 'CALLT 837');
  });

  test('ENDTRY', () => {
    const script = sb.emitOp('ENDTRY', Buffer.from([0x3])).build();
    myExpect(script, 'ENDTRY 3');
  });

  test('JMP_L', () => {
    const script = sb.emitOp('JMP_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'JMP_L 2147483647');
  });

  test('JMPIF_L', () => {
    const script = sb.emitOp('JMPIF_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'JMPIF_L 2147483647');
  });

  test('JMPIFNOT_L', () => {
    const script = sb.emitOp('JMPIFNOT_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'JMPIFNOT_L 2147483647');
  });

  test('JMPEQ_L', () => {
    const script = sb.emitOp('JMPEQ_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'JMPEQ_L 2147483647');
  });

  test('JMPNE_L', () => {
    const script = sb.emitOp('JMPNE_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'JMPNE_L 2147483647');
  });

  test('JMPGT_L', () => {
    const script = sb.emitOp('JMPGT_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'JMPGT_L 2147483647');
  });

  test('JMPLT_L', () => {
    const script = sb.emitOp('JMPLT_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'JMPLT_L 2147483647');
  });

  test('JMPGE_L', () => {
    const script = sb.emitOp('JMPGE_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'JMPGE_L 2147483647');
  });

  test('JMPLE_L', () => {
    const script = sb.emitOp('JMPLE_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'JMPLE_L 2147483647');
  });

  test('CALL_L', () => {
    const script = sb.emitOp('CALL_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'CALL_L 2147483647');
  });

  test('ENDTRY_L', () => {
    const script = sb.emitOp('ENDTRY_L', new BN(2147483647).toBuffer('le')).build();
    myExpect(script, 'ENDTRY_L 2147483647');
  });

  test('PUSHA', () => {
    const buf = Buffer.from([1, 2, 3, 4]);
    const script = sb.emitOp('PUSHA', buf).build();
    myExpect(script, 'PUSHA 0x01020304');
  });
});
