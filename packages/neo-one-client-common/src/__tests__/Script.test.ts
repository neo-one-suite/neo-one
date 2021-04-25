import { Instruction } from '../Instruction';
import { Op } from '../models/vm';
import { Script } from '../Script';
import { ScriptBuilder } from '../ScriptBuilder';

const isEmpty = (buf: Buffer) => buf.equals(Buffer.from([]));

describe('Script', () => {
  test('Parse', () => {
    const syscall = 'Neo.Crypto.CheckMultisig';
    const syscallBuff = Buffer.from([0x7b, 0xce, 0x6c, 0xa5]);
    const sb = new ScriptBuilder();
    sb.emitOp('PUSH0');
    sb.emitOp('CALL_L', Buffer.from([0x00, 0x01, 0x00, 0x00]));
    sb.emitSysCall(syscall);

    const script = new Script(sb.build());

    expect(script.length).toEqual(11);

    const ins1 = script.getInstruction(0);
    expect(ins1.opCode).toEqual(Op.PUSH0);
    expect(isEmpty(ins1.operand)).toBeTruthy();
    expect(ins1.size).toEqual(1);
    expect(() => ins1.tokenI16).toThrowError();
    expect(() => ins1.tokenU32).toThrowError();

    const ins2 = script.getInstruction(1);
    expect(ins2.opCode).toEqual(Op.CALL_L);
    expect(ins2.operand).toEqual(Buffer.from([0x00, 0x01, 0x00, 0x00]));
    expect(ins2.size).toEqual(5);
    expect(ins2.tokenI32).toEqual(256);
    expect(ins2.tokenString).toEqual(Buffer.from([0x00, 0x01, 0x00, 0x00]).toString('ascii'));

    const ins3 = script.getInstruction(6);
    expect(ins3.opCode).toEqual(Op.SYSCALL);
    expect(ins3.operand).toEqual(syscallBuff);
    expect(ins3.size).toEqual(5);
    expect(ins3.tokenI16).toEqual(syscallBuff.slice(0, 2).readInt16LE(0));
    expect(ins3.tokenString).toEqual(syscallBuff.toString('ascii'));
    expect(ins3.tokenU32).toEqual(syscallBuff.readUInt32LE(0));

    const ins4 = script.getInstruction(100);
    expect(ins4).toEqual(Instruction.RET);
  });
});
