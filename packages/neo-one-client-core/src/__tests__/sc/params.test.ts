import { data, keys } from '../../__data__';
import { params } from '../../sc/params';

describe('params', () => {
  const name = 'paramName';

  test('String - optional undefined', () => {
    const result = params.String(name, undefined, { type: 'String', optional: true });

    expect(result).toBeUndefined();
  });

  test('String - optional defined', () => {
    const value = 'foo';

    const result = params.String(name, value, { type: 'String', optional: true });

    expect(result).toEqual(value);
  });

  test('String - defined', () => {
    const value = 'foo';

    const result = params.String(name, value, { type: 'String' });

    expect(result).toEqual(value);
  });

  test('Address - optional undefined', () => {
    const result = params.Address(name, undefined, { type: 'Address', optional: true });

    expect(result).toBeUndefined();
  });

  test('Address - optional defined', () => {
    const value = keys[0].address;

    const result = params.Address(name, value, { type: 'Address', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('Address - defined', () => {
    const value = keys[0].address;

    const result = params.Address(name, value, { type: 'Address' });

    expect(result).toMatchSnapshot();
  });

  test('Hash256 - optional undefined', () => {
    const result = params.Hash256(name, undefined, { type: 'Hash256', optional: true });

    expect(result).toBeUndefined();
  });

  test('Hash256 - optional defined', () => {
    const value = data.hash256s.a;

    const result = params.Hash256(name, value, { type: 'Hash256', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('Hash256 - defined', () => {
    const value = data.hash256s.a;

    const result = params.Hash256(name, value, { type: 'Hash256' });

    expect(result).toMatchSnapshot();
  });

  test('PublicKey - optional undefined', () => {
    const result = params.PublicKey(name, undefined, { type: 'PublicKey', optional: true });

    expect(result).toBeUndefined();
  });

  test('PublicKey - optional defined', () => {
    const value = keys[0].publicKeyString;

    const result = params.PublicKey(name, value, { type: 'PublicKey', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('PublicKey - defined', () => {
    const value = keys[0].publicKeyString;

    const result = params.PublicKey(name, value, { type: 'PublicKey' });

    expect(result).toMatchSnapshot();
  });

  test('Integer - optional undefined', () => {
    const result = params.Integer(name, undefined, { type: 'Integer', optional: true, decimals: 4 });

    expect(result).toBeUndefined();
  });

  test('Integer - optional defined', () => {
    const value = data.bigNumbers.a;

    const result = params.Integer(name, value, { type: 'Integer', optional: true, decimals: 4 });

    expect(result).toMatchSnapshot();
  });

  test('Integer - defined', () => {
    const value = data.bigNumbers.a;

    const result = params.Integer(name, value, { type: 'Integer', decimals: 4 });

    expect(result).toMatchSnapshot();
  });

  test('Boolean - optional undefined', () => {
    const result = params.Boolean(name, undefined, { type: 'Boolean', optional: true });

    expect(result).toBeUndefined();
  });

  test('Boolean - optional defined', () => {
    const value = true;

    const result = params.Boolean(name, value, { type: 'Boolean', optional: true });

    expect(result).toEqual(value);
  });

  test('Boolean - defined', () => {
    const value = false;

    const result = params.Boolean(name, value, { type: 'Boolean' });

    expect(result).toEqual(value);
  });

  test('Buffer - optional undefined', () => {
    const result = params.Buffer(name, undefined, { type: 'Buffer', optional: true });

    expect(result).toBeUndefined();
  });

  test('Buffer - optional defined', () => {
    const value = data.buffers.a;

    const result = params.Buffer(name, value, { type: 'Buffer', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('Buffer - defined', () => {
    const value = data.buffers.a;

    const result = params.Buffer(name, value, { type: 'Buffer' });

    expect(result).toMatchSnapshot();
  });

  test('Signature - optional undefined', () => {
    const result = params.Signature(name, undefined, { type: 'Signature', optional: true });

    expect(result).toBeUndefined();
  });

  test('Signature - optional defined', () => {
    const value = data.signatures.a;

    const result = params.Signature(name, value, { type: 'Signature', optional: true });

    expect(result).toMatchSnapshot();
  });

  test('Signature - defined', () => {
    const value = data.signatures.a;

    const result = params.Signature(name, value, { type: 'Signature' });

    expect(result).toMatchSnapshot();
  });

  test('Array - optional undefined', () => {
    const result = params.Array(name, undefined, { type: 'Array', optional: true, value: { type: 'Boolean' } });

    expect(result).toBeUndefined();
  });

  test('Array - optional defined', () => {
    const value = [false];

    const result = params.Array(name, value, { type: 'Array', optional: true, value: { type: 'Boolean' } });

    expect(result).toEqual(value);
  });

  test('Array - defined', () => {
    const value = [true];

    const result = params.Array(name, value, { type: 'Array', value: { type: 'Boolean' } });

    expect(result).toEqual(value);
  });

  test('Void - optional undefined', () => {
    const result = params.Void(name, undefined, { type: 'Void', optional: true });

    expect(result).toBeUndefined();
  });

  test('Void - optional defined', () => {
    const value = undefined;

    const result = params.Void(name, value, { type: 'Void', optional: true });

    expect(result).toEqual(value);
  });

  test('Void - defined', () => {
    const value = true;

    const result = () => params.Void(name, value, { type: 'Void' });

    expect(result).toThrowErrorMatchingSnapshot();
  });
});
