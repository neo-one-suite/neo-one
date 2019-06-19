import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { common } from '../common';
import { JSONHelper as helper } from '../JSONHelper';

describe('JSON Helper Tests', () => {
  const oneBN = new BN(1, 16);
  const oneBigNumber = new BigNumber(1);

  test('UInt64LE', () => {
    const uInt64LEString = helper.writeUInt64LE(oneBN);
    const uInt64LEBN = helper.readUInt64LE(uInt64LEString);

    expect(uInt64LEBN.eq(oneBN)).toBeTruthy();
  });

  test('UInt64', () => {
    const uInt64String = helper.writeUInt64(oneBN);
    const uInt64BN = helper.readUInt64(uInt64String);

    expect(uInt64BN.isEqualTo(oneBigNumber)).toBeTruthy();
  });

  test('UInt160', () => {
    const uInt160String = helper.writeUInt160(common.ZERO_UINT160);
    const uInt160 = helper.readUInt160(uInt160String);

    expect(uInt160).toEqual(common.ZERO_UINT160);
  });

  test('Fixed8', () => {
    const fixed8String = helper.writeFixed8(oneBN);
    const fixed8BN = helper.readFixed8(fixed8String);

    expect(fixed8BN.eq(oneBN)).toBeTruthy();
  });

  test('ECPoint', () => {
    const ecPointString = helper.writeECPoint(common.ECPOINT_INFINITY);
    const ecPoint = helper.readECPoint(ecPointString);

    expect(ecPoint).toEqual(common.ECPOINT_INFINITY);
  });

  test('Buffer', () => {
    const bufferIn = Buffer.from([0x00]);
    const bufferString = helper.writeBuffer(bufferIn);
    const bufferOut = helper.readBuffer(bufferString);

    expect(bufferOut).toEqual(bufferIn);
  });
});
