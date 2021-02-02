import { assertByteCode, assertSysCall, assertVMState, getSysCallHash, SysCall, SysCallHashNum } from '../../models';

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

const createHexString = (bytes: Buffer): string => {
  let mutableResult = '';
  bytes.forEach((byte) => {
    mutableResult += `${byte.toString(16).padStart(2, '0')}`;
  });

  return `0x${mutableResult}`;
};

describe('SysCall Hashes', () => {
  test('Get SysCall hashes', () => {
    const result: { [key: string]: string } = {};
    // tslint:disable-next-line: no-loop-statement forin no-for-in
    for (const item in SysCall) {
      // tslint:disable-next-line: no-any no-object-mutation
      result[item] = createHexString(getSysCallHash(item as any));
    }
    // tslint:disable-next-line: no-console
    console.log(result);
  });

  // tslint:disable-next-line: no-loop-statement forin no-for-in
  for (const syscall in SysCall) {
    test(syscall, () => {
      const hash = getSysCallHash(syscall as SysCall);

      expect(SysCallHashNum[hash.readUInt32BE(0)]).toEqual(syscall);
    });
  }
});
