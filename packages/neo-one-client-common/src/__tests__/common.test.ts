import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import _ from 'lodash';
import { common } from '../common';
import { utils } from '../utils';

describe('fixedFromDecimal', () => {
  const decimals = 4;
  const expected = '100000';

  test('converts string to BN', () => {
    expect(common.fixedFromDecimal('10', decimals).toString(10)).toEqual(expected);
  });

  test('converts number to BN', () => {
    expect(common.fixedFromDecimal(10, decimals).toString(10)).toEqual(expected);
  });

  test('converts BigNumber to BN', () => {
    expect(common.fixedFromDecimal(new BigNumber(10), decimals).toString(10)).toEqual(expected);
  });

  test('converts BN to BN', () => {
    expect(common.fixedFromDecimal(new BN(expected, 10), decimals).toString(10)).toEqual(expected);
  });
});

describe('UInt160', () => {
  const uInt160 = common.ZERO_UINT160;
  const buffer160 = Buffer.from(uInt160);
  const string160 = `0x${'0'.repeat(40)}`;

  test('converts UInt160 to UInt160 (via from hex)', () => {
    expect(common.hexToUInt160(uInt160)).toEqual(uInt160);
  });

  test('converts String160 to Buffer160', () => {
    expect(common.uInt160ToBuffer(string160)).toEqual(buffer160);
  });

  test('converts String160 to String160', () => {
    expect(common.uInt160ToString(string160)).toEqual(string160);
  });

  test('Equals', () => {
    expect(common.uInt160Equal(uInt160, uInt160)).toBeTruthy();
  });
});

describe('UInt256', () => {
  const uInt256 = common.ZERO_UINT256;
  const buffer256 = Buffer.from(uInt256);
  const string256 = `0x${'0'.repeat(64)}`;

  test('converts UInt256 to UInt256 (via hexToUInt)', () => {
    expect(common.hexToUInt256(uInt256)).toEqual(uInt256);
  });

  test('converts String256 to Buffer256', () => {
    expect(common.uInt256ToBuffer(string256)).toEqual(buffer256);
  });

  test('toUInt32LE', () => {
    expect(common.toUInt32LE(uInt256)).toEqual(0);
  });

  test('Equals', () => {
    expect(common.uInt256Equal(uInt256, uInt256)).toBeTruthy();
  });
});

describe('ECPoint', () => {
  const ecBuffer = Buffer.from(_.range(33).map(() => 0x01));
  const ecPoint = common.asECPoint(ecBuffer);
  const ecString = '01'.repeat(common.ECPOINT_BUFFER_BYTES);
  const ecComp = common.stringToECPoint(`02${'01'.repeat(common.ECPOINT_BUFFER_BYTES - 1)}`);

  test('converts ECString to ECString', () => {
    expect(common.ecPointToHex(ecString)).toEqual(ecString);
  });

  test('converts ECPoint to ECPoint (via hexToECPoint)', () => {
    expect(common.hexToECPoint(ecPoint)).toEqual(ecPoint);
  });

  test('converts ECString to ECBuffer', () => {
    expect(common.ecPointToBuffer(ecString)).toEqual(ecBuffer);
  });

  test('converts ECString to string', () => {
    expect(common.ecPointToString(ecString)).toEqual(ecString);
  });

  test('EC Point Equals - True', () => {
    expect(common.ecPointEqual(ecPoint, ecPoint)).toBeTruthy();
  });

  test('EC Point Equals - False', () => {
    expect(common.ecPointEqual(ecPoint, ecComp)).toBeFalsy();
  });

  test('EC Point Compare - Equal', () => {
    expect(common.ecPointCompare(ecPoint, ecPoint)).toEqual(0);
  });

  test('EC Point Compare - LT', () => {
    expect(common.ecPointCompare(ecPoint, ecComp)).toEqual(-1);
  });

  test('EC Point Compare - GT', () => {
    expect(common.ecPointCompare(ecComp, ecPoint)).toEqual(1);
  });
});

describe('PrivateKey', () => {
  const privateBuffer = Buffer.from(_.range(32).map(() => 0x01));
  const privateKey = common.asPrivateKey(privateBuffer);
  const privateString = '01'.repeat(32);

  test('converts privateKeyString to privateKeyString', () => {
    expect(common.privateKeyToHex(privateString)).toEqual(privateString);
  });

  test('converts PrivateKey to PrivateKey (via from hex)', () => {
    expect(common.hexToPrivateKey(privateKey)).toEqual(privateKey);
  });

  test('converts privateKeyString to privateKeyBuffer', () => {
    expect(common.privateKeyToBuffer(privateString)).toEqual(privateBuffer);
  });

  test('converts PrivateKeyString to String', () => {
    expect(common.privateKeyToString(privateString)).toEqual(privateString);
  });

  test('asPrivateKey Errors', () => {
    const asPrivateKeyThrows = () => common.asPrivateKey('1');
    expect(asPrivateKeyThrows).toThrowError('Invalid Private Key, found: 1');
  });
});

describe('utils extra coverage', () => {
  test('randomUInt', () => {
    expect(typeof utils.randomUInt()).toEqual('number');
  });

  test('fromSignedBuffer - 0', () => {
    expect(utils.fromSignedBuffer(Buffer.from([]))).toEqual(new BN(0));
  });

  test('toSignedBuffer (-1)', () => {
    expect(utils.toSignedBuffer(new BN(-1))).toEqual(Buffer.from([0xff]));
  });

  test('toSignedBuffer <-> fromSignedBuffer', () => {
    const num = new BN(-81);
    expect(utils.fromSignedBuffer(utils.toSignedBuffer(num))).toEqual(num);
  });
});
