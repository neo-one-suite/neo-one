import {
  JSONHelper,
  common,
  utils,
} from '@neo-one/client-core';
import { contractParameters as parameters } from '../../sc/parameters';
import { InvalidContractParameterError } from '../../errors';
import * as abis from '../../__data__/abis';
import { contracts } from '../../__data__/contracts';

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
      test(param, () => {
        const result = (parameters as any)[param](
          (contracts as any)[param],
          (abis.parameters as any)[param] as any,
        );

        expect(result).toEqual((contracts as any)[param].value);
      });
    }

    test('Integer', () => {
      common.fixedToDecimal = jest.fn(() => contracts.Integer.value);
      const result = parameters.Integer(
        (contracts as any).Integer,
        (abis.parameters as any).Integer,
      );

      expect(result).toEqual(contracts.Integer.value);
    });

    test('Array', () => {
      const result = parameters.Array(
        (contracts as any).Array,
        (abis.returns as any).Array,
      );

      expect(result).toEqual([contracts.Array.value[0].value]);
    });

    test('Boolean from array', () => {
      const boolArray = {
        type: 'Array',
        value: [{ type: 'Boolean', value: false }],
      };

      const result = parameters.Boolean(
        boolArray as any,
        (abis.parameters as any).Boolean,
      );

      expect(result).toEqual(false);
    });

    test('nullable parameter', () => {
      const result = parameters.String(
        null as any,
        (abis.parameters as any).String,
      );

      expect(result).toBeNull();
    });

    test('nullable abi', () => {
      const result = parameters.Array(null as any, (abis.returns as any).Array);
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
          return (parameters as any)[param](
            contracts.Void,
            (abis.parameters as any)[param] as any,
          );
        }

        let options = [param, 'ByteArray'];
        if (param === 'Array' || param === 'Signature') {
          options = [param];
        }
        expect(testError).toThrow(new InvalidContractParameterError(
          (contracts as any).Void,
          options as any,
        ) as any);
      });
    }

    test('Array to byte array error', () => {
      function testError() {
        // @ts-ignore
        return parameters.ByteArray(
          (contracts.Array as any),
          (abis.parameters as any).ByteArray,
        );
      }

      expect(testError).toThrow(
        // @ts-ignore
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
          // @ts-ignore
          JSONHelper[testCase.json] = jest.fn(() => contracts.ByteArray.value);
        }

        if (testCase.common != null) {
          // @ts-ignore
          common[testCase.common] = jest.fn(() => contracts.ByteArray.value);
        }

        const result = (parameters as any)[param](
          contracts.ByteArray,
          (abis.parameters as any)[param] as any,
        );

        expect(result).toEqual(contracts.ByteArray.value);
      });
    }

    test('Integer from byte array', () => {
      common.fixedToDecimal = jest.fn(() => contracts.ByteArray.value);
      utils.fromSignedBuffer = jest.fn(() => {
        // do nothing
      });
      JSONHelper.readBuffer = jest.fn(() => {
        // do nothing
      });
      // @ts-ignore
      const result = parameters.Integer(
        (contracts.ByteArray as any),
        (abis.parameters as any).Integer,
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
          // @ts-ignore
          JSONHelper[testCase.json] = jest.fn(() => contracts[param].value);
        }

        if (testCase.utils != null) {
          // @ts-ignore
          utils[testCase.utils] = jest.fn(() => contracts[param].value);
        }

        if (testCase.common != null) {
          // @ts-ignore
          common[testCase.common] = jest.fn(() => contracts[param].value);
        }

        // @ts-ignore
        const result = parameters.ByteArray(
          (contracts as any)[param],
          (abis.parameters as any).ByteArray,
        );

        // @ts-ignore
        expect(result).toEqual(contracts[param].value.toString('hex'));
      });
    }

    test('String to byte array', () => {
      const expected = Buffer.from(contracts.String.value, 'utf-8');

      // @ts-ignore
      const result = parameters.ByteArray(
        (contracts.String as any),
        (abis.parameters as any).ByteArray,
      );

      expect(result).toEqual(expected.toString('hex'));
    });

    test('InteropInteface to byte array', () => {
      const expected = Buffer.alloc(0, 0);

      // @ts-ignore
      const result = parameters.ByteArray(
        (contracts.InteropInterface as any),
        (abis.parameters as any).ByteArray,
      );

      expect(result).toEqual(expected.toString('hex'));
    });

    test('Void to byte array', () => {
      const expected = Buffer.alloc(0, 0);

      // @ts-ignore
      const result = parameters.ByteArray(
        (contracts.Void as any),
        (abis.parameters as any).ByteArray,
      );

      expect(result).toEqual(expected.toString('hex'));
    });
  });
});
