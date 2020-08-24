import { assertByteCode, assertSysCall, assertVMState } from '../../models';

describe('VM Unit Tests - Functions', () => {
  test('Assert ByteCode', () => {
    const goodByte = 0x1;
    expect(assertByteCode(goodByte)).toEqual(goodByte);
  });
  test('Assert SysCall', () => {
    const goodSysCall = 'System.Storage.Put';
    expect(assertSysCall(goodSysCall)).toEqual(goodSysCall);
  });
  test('Assert VM State', () => {
    const goodVMState = 0x01;
    expect(assertVMState(goodVMState)).toEqual(goodVMState);
  });
});
describe('VM Unit Tests - Errors', () => {
  test('Assert ByteCode - Bad Byte', () => {
    const badByte = 0xff;
    expect(() => assertByteCode(badByte)).toThrowError(`Expected VM OpCode, received: ${badByte}`);
  });
  test('Assert SysCall - Bad Call', () => {
    const badSysCall = 'test';
    expect(() => assertSysCall(badSysCall)).toThrowError(`Expected sys call name, found: ${badSysCall}`);
  });
  test('Assert VM State - Bad State', () => {
    const badVMState = 0xff;
    expect(() => assertVMState(badVMState)).toThrowError(`Invalid VM State: ${badVMState}`);
  });
});
