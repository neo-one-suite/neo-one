import { common } from '@neo-one/client-core';
import { params } from '../../sc/params';
import { InvalidArgumentError } from '../../errors';
import * as args from '../../args';
import * as utils from '../../utils';
import * as abis from '../../__data__/abis';

describe('params', () => {
  const expected = '10';

  test('String param', () => {
    (args as any).assertString = jest.fn(() => expected);

    const result = params.String(expected, (abis.parameters as any).String);
    expect(result).toEqual(expected);
  });

  test('Hash160 param', () => {
    (args as any).assertHash160 = jest.fn(() => expected);
    common.stringToUInt160 = jest.fn(() => expected);

    const result = params.Hash160(expected, (abis.parameters as any).Hash160);
    expect(result).toEqual(expected);
  });

  test('Hash256 param', () => {
    (args as any).assertHash256 = jest.fn(() => expected);
    common.stringToUInt256 = jest.fn(() => expected);

    const result = params.Hash256(expected, (abis.parameters as any).Hash256);
    expect(result).toEqual(expected);
  });

  test('PublicKey param', () => {
    (args as any).assertPublicKey = jest.fn(() => expected);
    common.stringToECPoint = jest.fn(() => expected);

    const result = params.PublicKey(
      expected,
      (abis.parameters as any).PublicKey,
    );
    expect(result).toEqual(expected);
  });

  test('Integer param', () => {
    (args as any).assertBigNumber = jest.fn(() => expected);
    (utils as any).bigNumberToBN = jest.fn(() => expected);

    const result = params.Integer(expected, (abis.parameters as any).Integer);
    expect(result).toEqual(expected);
  });

  test('Boolean param', () => {
    (args as any).assertBoolean = jest.fn(() => expected);

    const result = params.Boolean(expected, (abis.parameters as any).Boolean);
    expect(result).toEqual(expected);
  });

  test('ByteArray param', () => {
    (args as any).assertBuffer = jest.fn(() => expected);

    const result = params.ByteArray(
      expected,
      (abis.parameters as any).ByteArray,
    );
    expect(result).toEqual(Buffer.from(expected, 'hex'));
  });

  test('Signature param', () => {
    (args as any).assertBuffer = jest.fn(() => expected);

    const result = params.Signature(
      expected,
      (abis.parameters as any).Signature,
    );
    expect(result).toEqual(Buffer.from(expected, 'hex'));
  });

  test('Array param throws error on non array', () => {
    function testError() {
      params.Array(expected, (abis.returns as any).Array);
    }

    expect(testError).toThrow(new InvalidArgumentError(
      `Expected Array, found: ${expected}`,
    ) as any);
  });

  test('Array param', () => {
    (args as any).assertString = jest.fn(() => expected);

    const result = params.Array([expected], (abis.returns as any).Array);
    expect(result).toEqual([expected]);
  });

  test('InteropInterface param throws error', () => {
    function testError() {
      params.InteropInterface(
        expected,
        (abis.parameters as any).InteropInterface,
      );
    }

    expect(testError).toThrow(new InvalidArgumentError(
      `InteropInterface is not a valid parameter`,
    ) as any);
  });

  test('Void param throws error', () => {
    function testError() {
      params.Void(expected, (abis.parameters as any).Void);
    }

    expect(testError).toThrow(new InvalidArgumentError(
      `Expected Void: ${String(expected)}`,
    ) as any);
  });

  test('Void param', () => {
    const result = params.Void(null, (abis.parameters as any).Void);

    expect(result).toBeNull();
  });
});
