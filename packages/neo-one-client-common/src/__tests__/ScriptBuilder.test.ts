import BN from 'bn.js';
import { common } from '../common';
import { Op } from '../models/vm';
import { ScriptBuilder } from '../ScriptBuilder';

describe('Scripter Builder Tests', () => {
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
    builder.emitPushInt(-1);

    expect(builder.buffers[0]).toEqual(Buffer.from([Op.PUSHM1]));
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

  test('EmitBoolean False', () => {
    builder.emitPushBoolean(false);

    expect(builder.buffers[0]).toEqual(Buffer.from([0x00]));
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

  test('emitTailCall', () => {
    builder.emitTailCall(common.ZERO_UINT160, '+');

    expect(builder.buffers[builder.buffers.length - 1].length).toEqual(20);
  });
});
