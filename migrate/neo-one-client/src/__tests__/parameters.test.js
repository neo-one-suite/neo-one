/* @flow */
// flowlint unclear-type:off
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { JSONHelper, common, utils } from '@neo-one/client-core';

import _ from 'lodash';

import type { ContractParameter } from '../types';

import parameters from '../parameters';

const stringValue = 'foobar';
const byteArrayValue = Buffer.from(stringValue, 'utf8');
const byteArrayContractParameter = {
  type: 'ByteArray',
  value: JSONHelper.writeBuffer(byteArrayValue),
};

const signatureValue = byteArrayValue;
const signatureContractParameter = {
  type: 'Signature',
  value: JSONHelper.writeBuffer(byteArrayValue),
};

const stringContractParameter = {
  type: 'String',
  value: stringValue,
};

const booleanValue = true;
const booleanContractParameter = {
  type: 'Boolean',
  value: booleanValue,
};

const integerValue = new BigNumber(10);
const integerContractParameter = {
  type: 'Integer',
  value: integerValue.toString(10),
};

const hash160Value = '0x1d0c643a8cce4421d67a9c62b80fc9844ec9d67d';
const hash160ContractParameter = {
  type: 'Hash160',
  value: JSONHelper.writeUInt160(common.stringToUInt160(hash160Value)),
};

const hash256Value =
  '0x1d0c643a8cce4421d67a9c62b80fc9844ec9d67d28a20762b7e75256b351c4da';
const hash256ContractParameter = {
  type: 'Hash256',
  value: JSONHelper.writeUInt256(common.stringToUInt256(hash256Value)),
};

const publicKeyValue =
  '1d0c643a8cce4421d67a9c62b80fc9844ec9d67d28a20762b7e75256b351c4dabc';
const publicKeyContractParameter = {
  type: 'PublicKey',
  value: JSONHelper.writeECPoint(common.stringToECPoint(publicKeyValue)),
};

const arrayValue = [stringValue];
const arrayContractParameter = {
  type: 'Array',
  value: [stringContractParameter],
};

type ContractParamaterConfig<T> = {|
  parameter: ContractParameter,
  converter: (value: ContractParameter) => T,
  converterNullable: (value: ContractParameter) => ?T,
  tests: Array<{
    value: T,
    parameter: ContractParameter,
  }>,
  comparator?: (a: T, b: T) => boolean,
  failParameters?: Array<ContractParameter>,
|};

const contractParameterConfigs = [
  {
    parameter: stringContractParameter,
    converter: parameters.toString,
    converterNullable: parameters.toStringNullable,
    tests: [
      {
        value: stringValue,
        parameter: stringContractParameter,
      },
      {
        value: stringValue,
        parameter: byteArrayContractParameter,
      },
    ],
  },
  {
    parameter: booleanContractParameter,
    converter: parameters.toBoolean,
    converterNullable: parameters.toBooleanNullable,
    tests: [
      {
        value: booleanValue,
        parameter: booleanContractParameter,
      },
      {
        value: true,
        parameter: {
          type: 'ByteArray',
          value: JSONHelper.writeBuffer(Buffer.alloc(1, 1)),
        },
      },
      {
        value: false,
        parameter: {
          type: 'ByteArray',
          value: JSONHelper.writeBuffer(Buffer.alloc(1, 0)),
        },
      },
      {
        value: true,
        parameter: {
          type: 'String',
          value: 'foo',
        },
      },
      {
        value: booleanValue,
        parameter: {
          type: 'Array',
          value: [booleanContractParameter],
        },
      },
      {
        value: true,
        parameter: hash160ContractParameter,
      },
      {
        value: true,
        parameter: hash256ContractParameter,
      },
      {
        value: true,
        parameter: publicKeyContractParameter,
      },
      {
        value: true,
        parameter: integerContractParameter,
      },
      {
        value: true,
        parameter: arrayContractParameter,
      },
      {
        value: true,
        parameter: signatureContractParameter,
      },
    ],
  },
  {
    parameter: hash160ContractParameter,
    converter: parameters.toHash160,
    converterNullable: parameters.toHash160Nullable,
    tests: [
      {
        value: hash160Value,
        parameter: hash160ContractParameter,
      },
      {
        value: hash160Value,
        parameter: {
          type: 'ByteArray',
          value: JSONHelper.writeBuffer(
            utils.reverse(
              common.uInt160ToBuffer(common.stringToUInt160(hash160Value)),
            ),
          ),
        },
      },
    ],
  },
  {
    parameter: hash256ContractParameter,
    converter: parameters.toHash256,
    converterNullable: parameters.toHash256Nullable,
    tests: [
      {
        value: hash256Value,
        parameter: hash256ContractParameter,
      },
      {
        value: hash256Value,
        parameter: {
          type: 'ByteArray',
          value: JSONHelper.writeBuffer(
            utils.reverse(
              common.uInt256ToBuffer(common.stringToUInt256(hash256Value)),
            ),
          ),
        },
      },
    ],
  },
  {
    parameter: publicKeyContractParameter,
    converter: parameters.toPublicKey,
    converterNullable: parameters.toPublicKeyNullable,
    tests: [
      {
        value: publicKeyValue,
        parameter: publicKeyContractParameter,
      },
      {
        value: publicKeyValue,
        parameter: {
          type: 'ByteArray',
          value: JSONHelper.writeBuffer(
            common.ecPointToBuffer(common.stringToECPoint(publicKeyValue)),
          ),
        },
      },
    ],
  },
  {
    parameter: signatureContractParameter,
    converter: parameters.toSignature,
    converterNullable: parameters.toSignatureNullable,
    tests: [
      {
        value: signatureValue,
        parameter: signatureContractParameter,
      },
    ],
  },
];

function createTest<T>(config: ContractParamaterConfig<T>): void {
  const {
    comparator,
    converter,
    converterNullable,
    parameter,
    tests,
    failParameters: failParametersIn,
  } = config;
  const failParameters = contractParameterConfigs
    .map(cfg => cfg.parameter)
    .concat(failParametersIn || []);
  describe(`to${parameter.type}`, () => {
    for (const testConfig of tests) {
      test(`should return the value of a ${
        testConfig.parameter.type
      } ContractParameter`, () => {
        if (comparator == null) {
          expect(converter(testConfig.parameter)).toEqual(testConfig.value);
        } else {
          expect(
            comparator(converter(testConfig.parameter), testConfig.value),
          ).toBeTruthy();
        }
      });
    }

    const validParameterTypes = new Set(
      config.tests.map(testConfig => testConfig.parameter.type),
    );

    for (const otherParameter of failParameters) {
      if (!validParameterTypes.has(otherParameter.type)) {
        test(`should throw InvalidContractParameterError for ${
          otherParameter.type
        }`, () => {
          // TODO: Check that it throws InvalidContractParameterError, seems
          // to break with jest --coverage
          expect(() => converter(otherParameter)).toThrow();
        });
      }
    }

    for (const otherParameter of failParameters) {
      if (!validParameterTypes.has(otherParameter.type)) {
        test(`should return null for ${
          otherParameter.type
        } using Nullable`, () => {
          expect(converterNullable(otherParameter)).toBeNull();
        });
      }
    }
  });
}

for (const config of contractParameterConfigs) {
  createTest(config);
}

createTest({
  parameter: byteArrayContractParameter,
  converter: parameters.toByteArray,
  converterNullable: parameters.toByteArrayNullable,
  tests: [
    {
      value: byteArrayValue,
      parameter: byteArrayContractParameter,
    },
    {
      value: Buffer.from(stringValue, 'utf8'),
      parameter: stringContractParameter,
    },
    {
      value: booleanValue ? Buffer.alloc(1, 1) : Buffer.alloc(1, 0),
      parameter: booleanContractParameter,
    },
    {
      value: common.uInt160ToBuffer(common.stringToUInt160(hash160Value)),
      parameter: hash160ContractParameter,
    },
    {
      value: common.uInt256ToBuffer(common.stringToUInt256(hash256Value)),
      parameter: hash256ContractParameter,
    },
    {
      value: common.ecPointToBuffer(common.stringToECPoint(publicKeyValue)),
      parameter: publicKeyContractParameter,
    },
    {
      value: utils.toSignedBuffer(new BN(integerValue.toString(10), 10)),
      parameter: integerContractParameter,
    },
    {
      value: Buffer.alloc(0, 0),
      parameter: {
        type: 'InteropInterface',
      },
    },
    {
      value: Buffer.alloc(0, 0),
      parameter: {
        type: 'Void',
      },
    },
    {
      value: signatureValue,
      parameter: signatureContractParameter,
    },
  ],
  comparator: (a: Buffer, b: Buffer) => a.equals(b),
  failParameters: [arrayContractParameter],
});

test('Invalid ByteArray ContractParameter', () => {
  // $FlowFixMe
  expect(() => parameters.toByteArray({ type: 'NotAType' })).toThrow();
});

createTest({
  parameter: integerContractParameter,
  converter: parameters.toInteger,
  converterNullable: parameters.toIntegerNullable,
  tests: [
    {
      value: integerValue,
      parameter: integerContractParameter,
    },
    {
      value: integerValue,
      parameter: {
        type: 'ByteArray',
        value: JSONHelper.writeBuffer(
          utils.toSignedBuffer(new BN(integerValue.toString(10), 10)),
        ),
      },
    },
  ],
  comparator: (a: BigNumber, b: BigNumber) => a.equals(b),
});

createTest({
  parameter: arrayContractParameter,
  converter: value => parameters.toArray(value, parameters.toString),
  converterNullable: value =>
    parameters.toArrayNullable(value, parameters.toString),
  tests: [
    {
      value: arrayValue,
      parameter: arrayContractParameter,
    },
  ],
  comparator: (a: Array<any>, b: Array<any>) => _.isEqual(a, b),
});

test('toVoid', () => {
  expect(parameters.toVoid({ type: 'Void' })).toBeUndefined();
});

test('toInteropInterface', () => {
  expect(
    parameters.toInteropInterface({ type: 'InteropInterface' }),
  ).toBeUndefined();
});
