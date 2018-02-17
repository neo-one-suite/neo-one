/* @flow */
import { common } from '@neo-one/client-core';

import params from '../../sc/params';
import { InvalidArgumentError } from '../../errors';

import * as args from '../../args';
import * as utils from '../../utils';
import * as abis from '../../__data__/abis';

describe('params', () => {
  const expected = '10';

  test('String param', () => {
    // $FlowFixMe
    args.assertString = jest.fn(() => expected);

    const result = params.String(expected, abis.parameters.String);
    expect(result).toEqual(expected);
  });

  test('Hash160 param', () => {
    // $FlowFixMe
    args.assertHash160 = jest.fn(() => expected);
    // $FlowFixMe
    common.stringToUInt160 = jest.fn(() => expected);

    const result = params.Hash160(expected, abis.parameters.Hash160);
    expect(result).toEqual(expected);
  });

  test('Hash256 param', () => {
    // $FlowFixMe
    args.assertHash256 = jest.fn(() => expected);
    // $FlowFixMe
    common.stringToUInt256 = jest.fn(() => expected);

    const result = params.Hash256(expected, abis.parameters.Hash256);
    expect(result).toEqual(expected);
  });

  test('PublicKey param', () => {
    // $FlowFixMe
    args.assertPublicKey = jest.fn(() => expected);
    // $FlowFixMe
    common.stringToECPoint = jest.fn(() => expected);

    const result = params.PublicKey(expected, abis.parameters.PublicKey);
    expect(result).toEqual(expected);
  });

  test('Integer param', () => {
    // $FlowFixMe
    args.assertBigNumber = jest.fn(() => expected);
    // $FlowFixMe
    utils.bigNumberToBN = jest.fn(() => expected);

    const result = params.Integer(expected, abis.parameters.Integer);
    expect(result).toEqual(expected);
  });

  test('Boolean param', () => {
    // $FlowFixMe
    args.assertBoolean = jest.fn(() => expected);

    const result = params.Boolean(expected, abis.parameters.Boolean);
    expect(result).toEqual(expected);
  });

  test('ByteArray param', () => {
    // $FlowFixMe
    args.assertBuffer = jest.fn(() => expected);

    const result = params.ByteArray(expected, abis.parameters.ByteArray);
    expect(result).toEqual(Buffer.from(expected, 'hex'));
  });

  test('Signature param', () => {
    // $FlowFixMe
    args.assertBuffer = jest.fn(() => expected);

    const result = params.Signature(expected, abis.parameters.Signature);
    expect(result).toEqual(Buffer.from(expected, 'hex'));
  });

  test('Array param throws error on non array', () => {
    function testError() {
      params.Array(expected, abis.returns.Array);
    }

    expect(testError).toThrow(
      new InvalidArgumentError(`Expected Array, found: ${expected}`),
    );
  });

  test('Array param', () => {
    // $FlowFixMe
    args.assertString = jest.fn(() => expected);

    const result = params.Array([expected], abis.returns.Array);
    expect(result).toEqual([expected]);
  });

  test('InteropInterface param throws error', () => {
    function testError() {
      params.InteropInterface(expected, abis.parameters.InteropInterface);
    }

    expect(testError).toThrow(
      new InvalidArgumentError(`InteropInterface is not a valid parameter`),
    );
  });

  test('Void param throws error', () => {
    function testError() {
      params.Void(expected, abis.parameters.Void);
    }

    expect(testError).toThrow(
      new InvalidArgumentError(`Expected Void: ${String(expected)}`),
    );
  });

  test('Void param', () => {
    const result = params.Void(null, abis.parameters.Void);

    expect(result).toBeNull();
  });
});
