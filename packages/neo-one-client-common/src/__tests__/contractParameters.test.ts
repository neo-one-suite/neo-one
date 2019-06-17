import { data, keys } from '../__data__';
import { common } from '../common';
import { contractParameters, smartContractConverters } from '../contractParameters';
import { BufferContractParameter } from '../types';
import { utils } from '../utils';

describe('contractParameters', () => {
  const undefinedValue: BufferContractParameter = { type: 'Buffer', value: '' };

  test('String - optional undefined', () => {
    const result = contractParameters.String(undefinedValue, { type: 'String', optional: true });

    expect(result).toBeUndefined();
  });

  test('String - optional defined', () => {
    const value = 'foo';

    const result = contractParameters.String({ type: 'String', value }, { type: 'String', optional: true });

    expect(result).toEqual(value);
  });

  test('String - defined', () => {
    const value = 'foo';

    const result = contractParameters.String({ type: 'String', value }, { type: 'String' });

    expect(result).toEqual(value);
  });

  test('String - Buffer', () => {
    const value = 'foo';

    const result = contractParameters.String(
      { type: 'Buffer', value: Buffer.from(value, 'utf8').toString('hex') },
      { type: 'String' },
    );

    expect(result).toEqual(value);
  });

  test('String - Invalid', () => {
    const result = () => contractParameters.String({ type: 'Void' }, { type: 'String' });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('Address - optional undefined', () => {
    const result = contractParameters.Address(undefinedValue, { type: 'Address', optional: true });

    expect(result).toBeUndefined();
  });

  test('Address - optional defined', () => {
    const value = keys[0].address;

    const result = contractParameters.Address({ type: 'Address', value }, { type: 'Address', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('Address - defined', () => {
    const value = keys[0].address;

    const result = contractParameters.Address({ type: 'Address', value }, { type: 'Address' });

    expect(result).toMatchSnapshot();
  });

  test('Address - defined', () => {
    const value = keys[0].scriptHash;

    const result = contractParameters.Address({ type: 'Buffer', value: value.toString('hex') }, { type: 'Address' });

    expect(result).toMatchSnapshot();
  });

  test('Address - Invalid', () => {
    const result = () => contractParameters.Address({ type: 'Void' }, { type: 'Address' });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('Hash256 - optional undefined', () => {
    const result = contractParameters.Hash256(undefinedValue, { type: 'Hash256', optional: true });

    expect(result).toBeUndefined();
  });

  test('Hash256 - optional defined', () => {
    const value = data.hash256s.a;

    const result = contractParameters.Hash256({ type: 'Hash256', value }, { type: 'Hash256', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('Hash256 - defined', () => {
    const value = data.hash256s.a;

    const result = contractParameters.Hash256({ type: 'Hash256', value }, { type: 'Hash256' });

    expect(result).toMatchSnapshot();
  });

  test('Hash256 - Buffer', () => {
    const value = data.hash256s.a;

    const result = contractParameters.Hash256(
      { type: 'Buffer', value: common.stringToUInt256(value).toString('hex') },
      { type: 'Hash256' },
    );

    expect(result).toMatchSnapshot();
  });

  test('Hash256 - Invalid', () => {
    const result = () => contractParameters.Hash256({ type: 'Void' }, { type: 'Hash256' });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('PublicKey - optional undefined', () => {
    const result = contractParameters.PublicKey(undefinedValue, { type: 'PublicKey', optional: true });

    expect(result).toBeUndefined();
  });

  test('PublicKey - optional defined', () => {
    const value = keys[0].publicKeyString;

    const result = contractParameters.PublicKey({ type: 'PublicKey', value }, { type: 'PublicKey', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('PublicKey - defined', () => {
    const value = keys[0].publicKeyString;

    const result = contractParameters.PublicKey({ type: 'PublicKey', value }, { type: 'PublicKey' });

    expect(result).toMatchSnapshot();
  });

  test('PublicKey - Buffer', () => {
    const value = keys[0].publicKey;

    const result = contractParameters.PublicKey(
      { type: 'Buffer', value: value.toString('hex') },
      { type: 'PublicKey' },
    );

    expect(result).toMatchSnapshot();
  });

  test('PublicKey - Invalid', () => {
    const result = () => contractParameters.PublicKey({ type: 'Void' }, { type: 'PublicKey' });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('Integer - optional undefined', () => {
    const result = contractParameters.Integer(undefinedValue, { type: 'Integer', optional: true, decimals: 4 });

    expect(result).toBeUndefined();
  });

  test('Integer - optional defined', () => {
    const value = data.bns.a;

    const result = contractParameters.Integer(
      { type: 'Integer', value },
      { type: 'Integer', optional: true, decimals: 4 },
    );

    expect(result).toMatchSnapshot();
  });

  test('Integer - defined', () => {
    const value = data.bns.a;

    const result = contractParameters.Integer({ type: 'Integer', value }, { type: 'Integer', decimals: 4 });

    expect(result).toMatchSnapshot();
  });

  test('Integer - Buffer', () => {
    const value = data.bns.a;

    const result = contractParameters.Integer(
      { type: 'Buffer', value: utils.toSignedBuffer(value).toString('hex') },
      { type: 'Integer', decimals: 4 },
    );

    expect(result).toMatchSnapshot();
  });

  test('Integer - Invalid', () => {
    const result = () => contractParameters.Integer({ type: 'Void' }, { type: 'Integer', decimals: 4 });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('Boolean - optional undefined', () => {
    const result = contractParameters.Boolean(undefinedValue, { type: 'Boolean', optional: true });

    expect(result).toBeUndefined();
  });

  test('Boolean - optional defined', () => {
    const value = true;

    const result = contractParameters.Boolean({ type: 'Boolean', value }, { type: 'Boolean', optional: true });

    expect(result).toEqual(value);
  });

  test('Boolean - defined', () => {
    const value = false;

    const result = contractParameters.Boolean({ type: 'Boolean', value }, { type: 'Boolean' });

    expect(result).toEqual(value);
  });

  test('Boolean - Array', () => {
    const value = false;

    const result = contractParameters.Boolean(
      { type: 'Array', value: [{ type: 'Boolean', value }] },
      { type: 'Boolean' },
    );

    expect(result).toEqual(value);
  });

  test('Buffer - optional undefined', () => {
    const result = contractParameters.Buffer(undefinedValue, { type: 'Buffer', optional: true });

    expect(result).toBeUndefined();
  });

  test('Buffer - optional defined', () => {
    const value = data.buffers.a;

    const result = contractParameters.Buffer({ type: 'Buffer', value }, { type: 'Buffer', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - defined', () => {
    const value = data.buffers.a;

    const result = contractParameters.Buffer({ type: 'Buffer', value }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - Signature', () => {
    const value = data.signatures.a;

    const result = contractParameters.Buffer({ type: 'Signature', value }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - Boolean', () => {
    const value = true;

    const result = contractParameters.Buffer({ type: 'Boolean', value }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - Integer', () => {
    const value = data.bns.a;

    const result = contractParameters.Buffer({ type: 'Integer', value }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - Address', () => {
    const value = keys[0].address;

    const result = contractParameters.Buffer({ type: 'Address', value }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - Hash256', () => {
    const value = data.hash256s.a;

    const result = contractParameters.Buffer({ type: 'Hash256', value }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - PublicKey', () => {
    const value = keys[0].publicKeyString;

    const result = contractParameters.Buffer({ type: 'PublicKey', value }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - String', () => {
    const value = 'foo';

    const result = contractParameters.Buffer({ type: 'String', value }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - InteropInterface', () => {
    const result = contractParameters.Buffer({ type: 'InteropInterface' }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - Void', () => {
    const result = contractParameters.Buffer({ type: 'Void' }, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - Array', () => {
    const result = () => contractParameters.Buffer({ type: 'Array', value: [] }, { type: 'Buffer' });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('Buffer - Array optional', () => {
    const result = () => contractParameters.Buffer({ type: 'Array', value: [] }, { type: 'Buffer', optional: true });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('Signature - optional undefined', () => {
    const result = contractParameters.Signature(undefinedValue, { type: 'Signature', optional: true });

    expect(result).toBeUndefined();
  });

  test('Signature - optional defined', () => {
    const value = data.signatures.a;

    const result = contractParameters.Signature({ type: 'Signature', value }, { type: 'Signature', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('Signature - defined', () => {
    const value = data.signatures.a;

    const result = contractParameters.Signature({ type: 'Signature', value }, { type: 'Signature' });

    expect(result).toMatchSnapshot();
  });

  test('Signature - defined', () => {
    const value = data.signatures.a;

    const result = contractParameters.Signature({ type: 'Buffer', value }, { type: 'Signature' });

    expect(result).toMatchSnapshot();
  });

  test('Signature - Invalid', () => {
    const result = () => contractParameters.Signature({ type: 'Void' }, { type: 'Signature' });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('Array - optional undefined', () => {
    const result = contractParameters.Array(undefinedValue, {
      type: 'Array',
      optional: true,
      value: { type: 'Boolean' },
    });

    expect(result).toBeUndefined();
  });

  test('Array - optional defined', () => {
    const value = [false];

    const result = contractParameters.Array(
      { type: 'Array', value: [{ type: 'Boolean', value: false }] },
      { type: 'Array', optional: true, value: { type: 'Boolean' } },
    );

    expect(result).toEqual(value);
  });

  test('Array - defined', () => {
    const value = [true];

    const result = contractParameters.Array(
      { type: 'Array', value: [{ type: 'Boolean', value: true }] },
      { type: 'Array', value: { type: 'Boolean' } },
    );

    expect(result).toEqual(value);
  });

  test('Array - Invalid', () => {
    const result = () => contractParameters.Array({ type: 'Void' }, { type: 'Array', value: { type: 'Boolean' } });

    expect(result).toThrowErrorMatchingSnapshot();
  });

  test('InteropInterface - optional undefined', () => {
    const result = smartContractConverters.toInteropInterfaceNullable(undefinedValue);

    expect(result).toBeUndefined();
  });

  test('InteropInterface - optional defined', () => {
    const result = smartContractConverters.toInteropInterfaceNullable({ type: 'InteropInterface' });

    expect(result).toEqual(undefined);
  });

  test('InteropInterface - defined', () => {
    const result = smartContractConverters.toInteropInterface({ type: 'InteropInterface' });

    expect(result).toEqual(undefined);
  });

  test('Void - optional undefined', () => {
    const result = contractParameters.Void(undefinedValue, { type: 'Void', optional: true });

    expect(result).toBeUndefined();
  });

  test('Void - optional defined', () => {
    const result = contractParameters.Void({ type: 'Void' }, { type: 'Void', optional: true });

    expect(result).toEqual(undefined);
  });

  test('Void - defined', () => {
    const result = contractParameters.Void({ type: 'Void' }, { type: 'Void' });

    expect(result).toEqual(undefined);
  });
});

describe('Extra Contract Parameter Coverage', () => {
  const stringMap = [
    {
      type: 'String' as const,
      value: 'one',
    },
    {
      type: 'String' as const,
      value: '1',
    },
  ] as const;

  const mapParam = {
    type: 'Map' as const,
    value: [stringMap],
  };

  const mapABI = {
    type: 'Map' as const,
    key: {
      type: 'String' as const,
    },
    value: {
      type: 'String' as const,
    },
  };

  const objABI = {
    type: 'Object' as const,
    properties: {
      one: {
        type: 'String' as const,
      },
    },
  };

  test('toForwardValue', () => {
    expect(smartContractConverters.toForwardValue(mapParam)).toEqual(mapParam);
  });

  test('toMap function', () => {
    const map = smartContractConverters.toMap(mapParam, mapABI);
    expect(map).toEqual(new Map([['one', '1'] as const]));
  });

  test('toObject function', () => {
    const obj = smartContractConverters.toObject(mapParam, objABI);
    expect(obj).toEqual({
      one: '1',
    });
  });

  test('toMap Throws', () => {
    const toMapThrows = () =>
      smartContractConverters.toMap(
        {
          type: 'Void' as 'Void',
        },
        mapABI,
      );

    expect(toMapThrows).toThrowError('Expected one of ["Map"] ContractParameterTypes, found Void');
  });

  test('toObject Throws', () => {
    const toObjectThrows = () =>
      smartContractConverters.toObject(
        {
          type: 'Void' as 'Void',
        },
        objABI,
      );

    expect(toObjectThrows).toThrowError('Expected one of ["Map"] ContractParameterTypes, found Void');
  });
});
