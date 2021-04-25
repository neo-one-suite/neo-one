import { Instruction } from '../Instruction';
import { Op } from '../models/vm';

describe('Instruction', () => {
  test('RET', () => {
    const inst = new Instruction(Buffer.from([Op.RET]), 0);
    expect(Instruction.RET).toEqual(inst);
  });

  test('CALL_L', () => {
    const inst = new Instruction(Buffer.from([Op.CALL_L, 0x00, 0x01, 0x00, 0x00]), 0);
    expect(inst.opCode).toEqual(Op.CALL_L);
    expect(inst.operand).toEqual(Buffer.from([0x00, 0x01, 0x00, 0x00]));
  });
});
