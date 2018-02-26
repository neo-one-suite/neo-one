/* @flow */
import BigNumber from 'bignumber.js';

import * as assertArgs from '../args';
import { InvalidArgumentError, InvalidNamedArgumentError } from '../errors';
import { keys } from '../__data__';
import converters from '../user/converters';

describe('arg assertions', () => {
  const name = 'name';
  const dummyString = 'dummy';
  const dummyInt = 10;
  const bigNum = new BigNumber('10');

  const workingTestCases = ([
    {
      method: 'assertString',
      args: [name, dummyString],
    },
    {
      method: 'assertAddress',
      args: [keys[0].address],
    },
    {
      method: 'assertNullableString',
      args: [name, null],
    },
    {
      method: 'assertNullableString',
      args: [name, dummyString],
    },
    {
      method: 'assertHash160',
      args: ['0x3775292229eccdf904f16fff8e83e7cffdc0f0ce'],
    },
    {
      method: 'assertHash256',
      args: [
        '0x798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
      ],
    },
    {
      method: 'assertBuffer',
      args: ['cef0c0fdcfe7838eff6ff104f9cdec2922297537'],
    },
    {
      method: 'assertPublicKey',
      args: [
        '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
      ],
    },
    {
      method: 'assertBigNumber',
      args: [bigNum],
    },
    {
      method: 'assertNullableBigNumber',
      args: [null],
    },
    {
      method: 'assertNullableBigNumber',
      args: [bigNum],
    },
    {
      method: 'assertBoolean',
      args: [true],
    },
    {
      method: 'assertNumber',
      args: [dummyInt],
    },
    {
      method: 'assertNullableNumber',
      args: [dummyInt],
    },
    {
      method: 'assertNullableNumber',
      args: [null],
    },
    {
      method: 'assertArray',
      args: [[]],
    },
    {
      method: 'assertBlockFilter',
      args: [null],
    },
    {
      method: 'assertBlockFilter',
      args: [{ indexStart: dummyInt, indexStop: dummyInt + 1 }],
    },
    {
      method: 'assertBlockFilter',
      args: [{}],
    },
    {
      method: 'assertGetOptions',
      args: [null],
    },
    {
      method: 'assertGetOptions',
      args: [{ timeout: dummyInt }],
    },
    {
      method: 'assertGetOptions',
      args: [{}],
    },
    {
      method: 'assertABIReturn',
      args: [{ type: 'Void' }],
    },
    {
      method: 'assertABIParameter',
      args: [{ name, type: 'Void' }],
    },
    {
      method: 'assertABIFunction',
      args: [
        {
          name,
          constant: true,
          parameters: [{ name, type: 'Void' }],
          returnType: { type: 'Void' },
        },
      ],
    },
    {
      method: 'assertABIFunction',
      args: [
        {
          name,
          returnType: { type: 'Void' },
        },
      ],
    },
    {
      method: 'assertABIEvent',
      args: [
        {
          name,
          parameters: [{ name, type: 'Void' }],
        },
      ],
    },
    {
      method: 'assertABI',
      args: [
        {
          functions: [
            {
              name,
              returnType: { type: 'Void' },
            },
          ],
        },
      ],
    },
    {
      method: 'assertABI',
      args: [
        {
          functions: [
            {
              name,
              returnType: { type: 'Void' },
            },
          ],
          events: [
            {
              name,
              parameters: [{ name, type: 'Void' }],
            },
          ],
        },
      ],
    },
    {
      method: 'assertTransactionOptions',
      args: [null],
    },
    {
      method: 'assertTransactionOptions',
      args: [{ networkFee: null }],
    },
  ]: $FlowFixMe);

  for (const testCase of workingTestCases) {
    const { method, args } = testCase;
    test(method, async () => {
      // $FlowFixMe
      const result = assertArgs[method](...args);

      expect(result).toEqual(args[args.length - 1]);
    });
  }

  test('assertAttributeArg', () => {
    // $FlowFixMe
    converters.attribute = jest.fn(() => {});

    const result = assertArgs.assertAttributeArg({});
    expect(result).toEqual({});
  });

  const errorTestCases = ([
    {
      method: 'assertString',
      message: 'assertString throws error on non-string',
      args: [name, dummyInt],
      error: new InvalidArgumentError(
        `Expected string for name, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertString',
      message: 'assertString throws error on missing param',
      args: [name],
      error: new InvalidArgumentError(
        `Expected string for name, found: undefined`,
      ),
    },
    {
      method: 'assertAddress',
      message: 'assertAddress throws error on non-string',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Address argument was not a string: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertAddress',
      message: 'assertAddress throws error on missing/null param',
      args: [null],
      error: new InvalidArgumentError(
        `Address argument was not a string: ${String(null)}`,
      ),
    },
    {
      method: 'assertAddress',
      message: 'assertAddress throws error on malformed address',
      args: [dummyString],
      error: new InvalidArgumentError(
        `Invalid address: ${String(dummyString)}`,
      ),
    },
    {
      method: 'assertHash160',
      message: 'assertHash160 throws error on non string',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Expected string for Hash160, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertHash160',
      message: 'assertHash160 throws error on missing 0x prefix',
      args: [dummyString],
      error: new InvalidArgumentError(
        `Hash160 must start with '0x', found: ${String(dummyString)}`,
      ),
    },
    {
      method: 'assertHash160',
      message: 'assertHash160 throws error on malformed hash160',
      args: [`0x${dummyString}`],
      error: new InvalidArgumentError(
        `Invalid Hash160 param, found: 0x${String(dummyString)}`,
      ),
    },
    {
      method: 'assertHash256',
      message: 'assertHash256 throws error on non string',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Expected string for Hash256, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertHash256',
      message: 'assertHash256 throws error on missing 0x prefix',
      args: [dummyString],
      error: new InvalidArgumentError(
        `Hash256 must start with '0x', found: ${String(dummyString)}`,
      ),
    },
    {
      method: 'assertHash256',
      message: 'assertHash256 throws error on malformed hash256',
      args: [`0x${dummyString}`],
      error: new InvalidArgumentError(
        `Invalid Hash256 param, found: 0x${String(dummyString)}`,
      ),
    },
    {
      method: 'assertBuffer',
      message: 'assertBuffer throws error on non hex string',
      args: [dummyString],
      error: new InvalidArgumentError(
        `Expected hex string, found: ${String(dummyString)}`,
      ),
    },
    {
      method: 'assertBuffer',
      message: 'assertBuffer throws error on non string',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Expected string for Buffer, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertPublicKey',
      message: 'assertPublicKey throws error on unbufferable param',
      args: [dummyString],
      error: new InvalidArgumentError(
        `Expected hex string, found: ${String(dummyString)}`,
      ),
    },
    {
      method: 'assertPublicKey',
      message: 'assertPublicKey throws error on malformed key',
      args: ['ffff'],
      error: new InvalidArgumentError(`Expected PublicKey, found: ffff`),
    },
    {
      method: 'assertBigNumber',
      message: 'assertBigNumber throws error on non bignumber',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Expected BigNumber, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertBigNumber',
      message: 'assertBigNumber throws error on non bignumber string',
      args: ['10'],
      error: new InvalidArgumentError(`Expected BigNumber, found: 10`),
    },
    {
      method: 'assertBoolean',
      message: 'assertBoolean throws error on null',
      args: [null],
      error: new InvalidArgumentError(
        `Expected boolean, found: ${String(null)}`,
      ),
    },
    {
      method: 'assertBoolean',
      message: 'assertBoolean throws error on non bool',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Expected boolean, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertNumber',
      message: 'assertNumber throws error on null',
      args: [null],
      error: new InvalidArgumentError(
        `Expected number, found: ${String(null)}`,
      ),
    },
    {
      method: 'assertNumber',
      message: 'assertNumber throws error on non number',
      args: [dummyString],
      error: new InvalidArgumentError(`Expected number, found: ${dummyString}`),
    },
    {
      method: 'assertNullableNumber',
      message: 'assertNullableNumber throws error on non null or number',
      args: [dummyString],
      error: new InvalidArgumentError(`Expected number, found: ${dummyString}`),
    },
    {
      method: 'assertArray',
      message: 'assertArray throws error on non array',
      args: [dummyString],
      error: new InvalidArgumentError(`Expected Array, found: ${dummyString}`),
    },
    {
      method: 'assertBlockFilter',
      message: 'assertBlockFilter throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Invalid BlockFilter param, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertBlockFilter',
      message: 'assertBlockFilter throws error on indexStart non number',
      args: [{ indexStart: dummyString, indexStop: dummyInt }],
      error: new InvalidArgumentError(
        `Invalid BlockFilter param, found: ${String({
          indexStart: dummyString,
          indexStop: dummyInt,
        })}`,
      ),
    },
    {
      method: 'assertBlockFilter',
      message: 'assertBlockFilter throws error on indexStop non number',
      args: [{ indexStart: dummyInt, indexStop: dummyString }],
      error: new InvalidArgumentError(
        `Invalid BlockFilter param, found: ${String({
          indexStart: dummyInt,
          indexStop: dummyString,
        })}`,
      ),
    },
    {
      method: 'assertBlockFilter',
      message: 'assertBlockFilter throws error on indexStop<=indexStart',
      args: [{ indexStart: dummyInt + 1, indexStop: dummyInt - 1 }],
      error: new InvalidArgumentError(
        `Invalid BlockFilter param, found: ${String({
          indexStart: dummyInt + 1,
          indexStop: dummyInt - 1,
        })}`,
      ),
    },
    {
      method: 'assertGetOptions',
      message: 'assertGetOptions throws error on invalid timeout field',
      args: [{ timeout: dummyString }],
      error: new InvalidArgumentError(
        `Invalid GetOptions param, found: ${String({ timeout: dummyString })}`,
      ),
    },
    {
      method: 'assertGetOptions',
      message: 'assertGetOptions throws error on non object',
      args: [dummyString],
      error: new InvalidArgumentError(
        `Invalid GetOptions param, found: ${dummyString}`,
      ),
    },
    {
      method: 'assertABIReturn',
      message: 'assertABIReturn throws error on null',
      args: [null],
      error: new InvalidArgumentError(
        `Invalid ABI return, found: ${String(null)}`,
      ),
    },
    {
      method: 'assertABIReturn',
      message: 'assertABIReturn throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Invalid ABI return, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIReturn',
      message: 'assertABIReturn throws error on non number type for Integer',
      args: [
        { type: 'Array', value: { type: 'Integer', decimals: dummyString } },
      ],
      error: new InvalidArgumentError(
        `Expected number, found: ${String(dummyString)}`,
      ),
    },
    {
      method: 'assertABIReturn',
      message: 'assertABIReturn throws error on invalid ABI type',
      args: [{ type: 'INVALID' }],
      error: new InvalidArgumentError(
        `Invalid ABI return, found: ${String({ type: 'INVALID' })}`,
      ),
    },
    {
      method: 'assertABIParameter',
      message: 'assertABIParameter throws error on non string name',
      args: [{ name: dummyInt }],
      error: new InvalidArgumentError(
        `Expected string for name, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIParameter',
      message: 'assertABIParameter throws error on non ABIReturn',
      args: [{ name, type: 'INVALID' }],
      error: new InvalidArgumentError(
        `Invalid ABI return, found: ${String({ type: 'INVALID' })}`,
      ),
    },
    {
      method: 'assertABIParameter',
      message: 'assertABIParameter throws error on null',
      args: [null],
      error: new InvalidArgumentError(
        `Invalid ABI parameter, found: ${String(null)}`,
      ),
    },
    {
      method: 'assertABIParameter',
      message: 'assertABIParameter throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Invalid ABI parameter, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non string name',
      args: [{ name: dummyInt }],
      error: new InvalidArgumentError(
        `Expected string for name, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non bool constant',
      args: [{ name, constant: dummyInt }],
      error: new InvalidArgumentError(
        `Expected boolean, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on null',
      args: [null],
      error: new InvalidArgumentError(
        `Invalid ABI function, found: ${String(null)}`,
      ),
    },
    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Invalid ABI function, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non ABIParameter parameters',
      args: [{ name, parameters: [null] }],
      error: new InvalidArgumentError(
        `Invalid ABI parameter, found: ${String(null)}`,
      ),
    },
    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non Array parameters',
      args: [{ name, parameters: dummyInt }],
      error: new InvalidArgumentError(
        `Expected Array, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on invalid returnType',
      args: [{ name, returnType: dummyInt }],
      error: new InvalidArgumentError(
        `Invalid ABI return, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on null',
      args: [null],
      error: new InvalidArgumentError(
        `Invalid ABI event, found: ${String(null)}`,
      ),
    },
    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Invalid ABI event, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on non string name',
      args: [{ name: dummyInt }],
      error: new InvalidArgumentError(
        `Expected string for name, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on non array parameters',
      args: [{ name, parameters: dummyInt }],
      error: new InvalidArgumentError(
        `Expected Array, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on non ABIParameter parameters',
      args: [{ name, parameters: [dummyInt] }],
      error: new InvalidArgumentError(
        `Invalid ABI parameter, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABI',
      message: 'assertABI throws error on null',
      args: [null],
      error: new InvalidArgumentError(
        `Invalid ABI param, found: ${String(null)}`,
      ),
    },
    {
      method: 'assertABI',
      message: 'assertABI throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(
        `Invalid ABI param, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABI',
      message: 'assertABI throws non array functions',
      args: [
        {
          functions: dummyInt,
        },
      ],
      error: new InvalidArgumentError(`Expected Array, found: ${dummyInt}`),
    },
    {
      method: 'assertABI',
      message: 'assertABI throws non ABIFunction functions',
      args: [
        {
          hash: '0x3775292229eccdf904f16fff8e83e7cffdc0f0ce',
          functions: [dummyInt],
        },
      ],
      error: new InvalidArgumentError(
        `Invalid ABI function, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertABI',
      message: 'assertABI throws non non array events',
      args: [
        {
          functions: [{ name, returnType: { type: 'Void' } }],
          events: dummyInt,
        },
      ],
      error: new InvalidArgumentError(`Expected Array, found: ${dummyInt}`),
    },
    {
      method: 'assertABI',
      message: 'assertABI throws non non ABI Event events',
      args: [
        {
          functions: [{ name, returnType: { type: 'Void' } }],
          events: [dummyInt],
        },
      ],
      error: new InvalidArgumentError(
        `Invalid ABI event, found: ${String(dummyInt)}`,
      ),
    },
    {
      method: 'assertTransactionOptions',
      message: 'assertTransactionOptions throws error on non object',
      args: [dummyInt],
      error: new InvalidNamedArgumentError('TransactionOptions', dummyInt),
    },
    {
      method: 'assertTransactionOptions',
      message: 'assertTransactionOptions throws error on non attribute array',
      args: [{ attributes: dummyInt }],
      error: new InvalidNamedArgumentError('TransactionOptions', {
        attributes: dummyInt,
      }),
    },
    {
      method: 'assertTransactionOptions',
      message:
        'assertTransactionOptions throws error on non BigNumber networkFee',
      args: [{ attributes: [], networkFee: dummyInt }],
      error: new InvalidArgumentError(
        `Expected BigNumber, found: ${String(dummyInt)}`,
      ),
    },
  ]: $FlowFixMe);

  for (const testCase of errorTestCases) {
    const { method, message, args, error } = testCase;
    test(message, async () => {
      function testError() {
        // $FlowFixMe
        assertArgs[method](...args);
      }
      // $FlowFixMe
      expect(testError).toThrow(error);
    });
  }

  test('assertAttributeArg throws error through assertTransactionOptions', () => {
    const arg = { attributes: [dummyInt] };
    // $FlowFixMe
    converters.attribute = jest.fn(() => {
      throw new Error();
    });
    function testError() {
      assertArgs.assertTransactionOptions(arg);
    }
    expect(testError).toThrow(
      new InvalidNamedArgumentError('AttributeArg', dummyInt),
    );
  });
});
