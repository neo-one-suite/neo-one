/* @flow */
import {
  InvalidContractParameterTypeJSONError,
  JSONHelper,
  common,
  utils,
} from '@neo-one/client-core';

import parameters from '../../sc/parameters';
import { InvalidContractParameterError } from '../../errors';
import * as abis from '../../__data__/abis';
import contracts from '../../__data__/contracts';

describe('parameters', () => {
  describe('check parameters of correct type', () => {
    const testCases = [
      'String',
      'Hash160',
      'Hash256',
      'PublicKey',
      'Boolean',
      'Signature',
      'InteropInterface',
      'Void',
    ];

    for (const param of testCases) {
      // eslint-disable-next-line
      test(param, () => {
        const result = parameters[param](
          contracts[param],
          (abis.parameters[param]: $FlowFixMe),
        );
        // $FlowFixMe
        expect(result).toEqual(contracts[param].value);
      });
    }

    test('Integer', () => {
      // $FlowFixMe
      common.fixedToDecimal = jest.fn(() => contracts.Integer.value);
      const result = parameters.Integer(
        contracts.Integer,
        abis.parameters.Integer,
      );

      expect(result).toEqual(contracts.Integer.value);
    });

    test('Array', () => {
      const result = parameters.Array(contracts.Array, abis.returns.Array);

      expect(result).toEqual([contracts.Array.value[0].value]);
    });

    test('Boolean from array', () => {
      const boolArray = {
        type: 'Array',
        value: [{ type: 'Boolean', value: false }],
      };
      const result = parameters.Boolean(boolArray, abis.parameters.Boolean);

      expect(result).toEqual(false);
    });

    test('nullable parameter', () => {
      const result = parameters.String(
        (null: $FlowFixMe),
        abis.parameters.String,
      );
      expect(result).toBeNull();
    });

    test('nullable abi', () => {
      const result = parameters.Array((null: $FlowFixMe), abis.returns.Array);
      expect(result).toBeNull();
    });
  });

  describe('incorrect parameter types throw errors', () => {
    const errorTestCases = [
      'String',
      'Hash160',
      'Hash256',
      'PublicKey',
      'Integer',
      'Signature',
      'Array',
    ];

    for (const param of errorTestCases) {
      test(`${param} throws error`, () => {
        function testError() {
          return parameters[param](
            contracts.Void,
            (abis.parameters[param]: $FlowFixMe),
          );
        }

        let options = [param, 'ByteArray'];
        if (param === 'Array' || param === 'Signature') {
          options = [param];
        }
        expect(testError).toThrow(
          new InvalidContractParameterError(contracts.Void, options),
        );
      });
    }

    test('Array to byte array error', () => {
      function testError() {
        return parameters.ByteArray(contracts.Array, abis.parameters.ByteArray);
      }

      expect(testError).toThrow(
        new InvalidContractParameterError(contracts.Array, [
          'Signature',
          'Boolean',
          'Integer',
          'Hash160',
          'Hash256',
          'ByteArray',
          'PublicKey',
          'String',
          'InteropInterface',
          'Void',
        ]),
      );
    });

    test('Array to byte array error', () => {
      function testError() {
        return parameters.ByteArray(
          ({ type: 'Unknown' }: $FlowFixMe),
          abis.parameters.ByteArray,
        );
      }

      expect(testError).toThrow(
        new InvalidContractParameterTypeJSONError('Unknown'),
      );
    });
  });

  describe('parameter converted from byte array', () => {
    const fromByteArrayCases = [
      {
        param: 'String',
        json: 'readBuffer',
      },
      {
        param: 'Hash160',
        json: 'writeUInt160',
        common: 'bufferToUInt160',
      },
      {
        param: 'Hash256',
        json: 'writeUInt256',
        common: 'bufferToUInt256',
      },
      {
        param: 'PublicKey',
        json: 'readECPoint',
        common: 'ecPointToString',
      },
    ];

    for (const testCase of fromByteArrayCases) {
      const { param } = testCase;

      test(`${param} from bytearray`, () => {
        if (testCase.json != null) {
          // $FlowFixMe
          JSONHelper[testCase.json] = jest.fn(() => contracts.ByteArray.value);
        }

        if (testCase.common != null) {
          // $FlowFixMe
          common[testCase.common] = jest.fn(() => contracts.ByteArray.value);
        }

        const result = parameters[param](
          contracts.ByteArray,
          (abis.parameters[param]: $FlowFixMe),
        );
        expect(result).toEqual(contracts.ByteArray.value);
      });
    }

    test('Integer from byte array', () => {
      // $FlowFixMe
      common.fixedToDecimal = jest.fn(() => contracts.ByteArray.value);
      // $FlowFixMe
      utils.fromSignedBuffer = jest.fn(() => {});
      // $FlowFixMe
      JSONHelper.readBuffer = jest.fn(() => {});
      const result = parameters.Integer(
        contracts.ByteArray,
        abis.parameters.Integer,
      );

      expect(result).toEqual(contracts.ByteArray.value);
    });
  });

  describe('parameter converted to byte array', () => {
    const toByteArrayCases = [
      {
        param: 'Signature',
        json: 'readBuffer',
      },
      {
        param: 'Integer',
        utils: 'toSignedBuffer',
      },
      {
        param: 'Hash160',
        json: 'readUInt160',
        common: 'uInt160ToBuffer',
      },
      {
        param: 'Hash256',
        json: 'readUInt256',
        common: 'uInt256ToBuffer',
      },
      {
        param: 'ByteArray',
        json: 'readBuffer',
      },
      {
        param: 'PublicKey',
        json: 'readECPoint',
        common: 'ecPointToBuffer',
      },
    ];

    for (const testCase of toByteArrayCases) {
      const { param } = testCase;

      test(`${param} to bytearray`, () => {
        if (testCase.json != null) {
          // $FlowFixMe
          JSONHelper[testCase.json] = jest.fn(() => contracts[param].value);
        }

        if (testCase.utils != null) {
          // $FlowFixMe
          utils[testCase.utils] = jest.fn(() => contracts[param].value);
        }

        if (testCase.common != null) {
          // $FlowFixMe
          common[testCase.common] = jest.fn(() => contracts[param].value);
        }

        const result = parameters.ByteArray(
          contracts[param],
          abis.parameters.ByteArray,
        );
        // $FlowFixMe
        expect(result).toEqual(contracts[param].value.toString('hex'));
      });
    }

    test('String to byte array', () => {
      const expected = Buffer.from(contracts.String.value, 'utf-8');

      const result = parameters.ByteArray(
        contracts.String,
        abis.parameters.ByteArray,
      );

      expect(result).toEqual(expected.toString('hex'));
    });

    test('InteropInteface to byte array', () => {
      const expected = Buffer.alloc(0, 0);

      const result = parameters.ByteArray(
        contracts.InteropInterface,
        abis.parameters.ByteArray,
      );

      expect(result).toEqual(expected.toString('hex'));
    });

    test('Void to byte array', () => {
      const expected = Buffer.alloc(0, 0);

      const result = parameters.ByteArray(
        contracts.Void,
        abis.parameters.ByteArray,
      );

      expect(result).toEqual(expected.toString('hex'));
    });
  });
});
