import { BN } from 'bn.js';
import { Op } from '../models/vm';
import { ScriptBuilder } from '../ScriptBuilder';

describe('Script Builder Tests', () => {
  let builder: ScriptBuilder;

  beforeEach(() => {
    builder = new ScriptBuilder();
  });

  test('Emit Push Small', () => {
    const smallBuffer = Buffer.allocUnsafe(0x100 - 1);
    builder.emitPush(smallBuffer);

    expect(builder.buffers[0]).toEqual(Buffer.from([Op.PUSHDATA1]));
  });

  test('Emit Push Medium', () => {
    const medBuffer = Buffer.allocUnsafe(0x100);
    builder.emitPush(medBuffer);

    expect(builder.buffers[0]).toEqual(Buffer.from([Op.PUSHDATA2]));
  });

  test('Emit Push Big', () => {
    const bigBuffer = Buffer.allocUnsafe(0x10000);
    builder.emitPush(bigBuffer);

    expect(builder.buffers[0]).toEqual(Buffer.from([Op.PUSHDATA4]));
  });

  test('Emit Push Int', () => {
    builder.emitPushInt(0);

    expect(builder.build()).toEqual(Buffer.from([Op.PUSH0]));
  });

  test('Emit Push Int', () => {
    builder.emitPushInt(-1);

    expect(builder.buffers[0]).toEqual(Buffer.from([Op.PUSHM1]));
  });

  test('Emit Push Negative Big Int', () => {
    builder.emitPushInt(-100000);

    expect(builder.build()).toEqual(Buffer.from([2, 96, 121, 254, 255]));
  });

  test('Emit Push Big Int', () => {
    builder.emitPushInt(100000);

    expect(builder.build()).toEqual(Buffer.from([2, 160, 134, 1, 0]));
  });

  // tslint:disable-next-line: no-loop-statement
  for (let i = 0; i <= 16; i += 1) {
    test('Small Int', () => {
      builder.emitPushInt(i);

      expect(builder.build()).toEqual(Buffer.from([Op.PUSH0 + i]));
    });
  }

  const ULONG_MAX = new BN('18446744073709551615', 10);
  const pairs: ReadonlyArray<[number | BN, string]> = [
    [-128, '0080'],
    [127, '007f'],
    [255, '01ff00'],
    [-32768, '010080'],
    [32767, '01ff7f'],
    [65535, '02ffff0000'],
    [-2147483648, '0200000080'],
    [2147483647, '02ffffff7f'],
    [4294967295, '03ffffffff00000000'],
    [new BN('-9223372036854775808', 10), '030000000000000080'],
    [new BN('9223372036854775807', 10), '03ffffffffffffff7f'],
    [ULONG_MAX, '04ffffffffffffffff0000000000000000'],
    [ULONG_MAX.mul(ULONG_MAX), '050100000000000000feffffffffffffff00000000000000000000000000000000'],
  ];
  pairs.forEach(([num, hex]) => {
    test(`Max and Min Int Vals ${num.toString()}`, () => {
      builder.emitPushInt(num);

      expect(builder.build()).toEqual(Buffer.from(hex, 'hex'));
    });
  });

  test('Emit Int Out of Range Throws', () => {
    expect(() =>
      builder.emitPushInt(
        new BN('050100000000000000feffffffffffffff0100000000000000feffffffffffffff00000000000000000000000000000000'),
      ),
    ).toThrow();
  });

  test('Emit Int16LE', () => {
    builder.emitInt16LE(16);
    expect(builder.buffers[0]).toEqual(Buffer.concat([Buffer.from([0x10]), Buffer.from([0x00])]));
  });

  test('Emit UInt8', () => {
    builder.emitUInt8(1);

    expect(builder.buffers[0]).toEqual(Buffer.from([0x01]));
  });

  test('Emit UInt16LE', () => {
    builder.emitUInt16LE(16);

    expect(builder.buffers[0]).toEqual(Buffer.concat([Buffer.from([0x10]), Buffer.from([0x00])]));
  });

  test('Emit UInt 32LE', () => {
    builder.emitUInt32LE(32);

    expect(builder.buffers[0].toString('hex')).toEqual('20000000');
  });

  test('EmitBoolean True', () => {
    builder.emitPushBoolean(true);

    expect(builder.buffers[0]).toEqual(Buffer.from([Op.PUSH1]));
  });

  test('EmitBoolean False', () => {
    builder.emitPushBoolean(false);

    expect(builder.buffers[0]).toEqual(Buffer.from([Op.PUSH0]));
  });

  test('EmitPushParam - undefined', () => {
    builder.emitPushParam(undefined);

    expect(builder.buffers[0]).toEqual(Buffer.from([0x00]));
  });

  test('emitPushParam - Map', () => {
    const testMap = new Map([[0, 1]]);
    builder.emitPushParam(testMap);

    expect(builder.buffers).toEqual([
      Buffer.from([Op.NEWMAP]),
      Buffer.from([Op.DUP]),
      Buffer.from([0x00]),
      Buffer.from([Op.PUSH1 - 1 + new BN(1).toNumber()]),
      Buffer.from([Op.SETITEM]),
    ]);
  });

  test('emitPushParam - Object', () => {
    const testObj = { zero: 0 };
    builder.emitPushParam(testObj);

    expect(builder.buffers).toEqual([
      Buffer.from([Op.NEWMAP]),
      Buffer.from([Op.DUP]),
      Buffer.from(['zero'.length]),
      Buffer.from('zero', 'utf8'),
      Buffer.from([0x00]),
      Buffer.from([Op.SETITEM]),
    ]);
  });
});
