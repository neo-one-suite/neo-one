/* @flow */
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { JSONHelper, common, utils } from '@neo-one/core';

import type { ContractParameter } from './types';
import { InvalidContractParameterError } from './errors';

type To<T> = (parameter: ContractParameter) => T;

function createNullable<T>(to: To<T>): To<?T> {
  return parameter => {
    try {
      return to(parameter);
    } catch (error) {
      return null;
    }
  };
}

const toString = (parameter: ContractParameter): string => {
  if (parameter.type === 'String') {
    return parameter.value;
  } else if (parameter.type === 'ByteArray') {
    return JSONHelper.readBuffer(parameter.value).toString('utf8');
  }

  throw new InvalidContractParameterError(parameter, ['String', 'ByteArray']);
};
const toStringNullable = (createNullable(toString): To<?string>);

const toHash160 = (parameter: ContractParameter): string => {
  if (parameter.type === 'Hash160') {
    return parameter.value;
  } else if (parameter.type === 'ByteArray') {
    return common.uInt160ToString(JSONHelper.readUInt160(parameter.value));
  }

  throw new InvalidContractParameterError(parameter, ['Hash160', 'ByteArray']);
};
const toHash160Nullable = (createNullable(toHash160): To<?string>);

const toHash256 = (parameter: ContractParameter): string => {
  if (parameter.type === 'Hash256') {
    return parameter.value;
  } else if (parameter.type === 'ByteArray') {
    return common.uInt256ToString(JSONHelper.readUInt256(parameter.value));
  }

  throw new InvalidContractParameterError(parameter, ['Hash256', 'ByteArray']);
};
const toHash256Nullable = (createNullable(toHash256): To<?string>);

const toPublicKey = (parameter: ContractParameter): string => {
  if (parameter.type === 'PublicKey') {
    return parameter.value;
  } else if (parameter.type === 'ByteArray') {
    return common.ecPointToString(JSONHelper.readECPoint(parameter.value));
  }

  throw new InvalidContractParameterError(parameter, [
    'PublicKey',
    'ByteArray',
  ]);
};
const toPublicKeyNullable = (createNullable(toPublicKey): To<?string>);

const toInteger = (
  parameter: ContractParameter,
  decimals?: number,
): BigNumber => {
  let value;
  if (parameter.type === 'Integer') {
    value = new BN(parameter.value, 10);
  } else if (parameter.type === 'ByteArray') {
    value = utils.fromSignedBuffer(JSONHelper.readBuffer(parameter.value));
  } else {
    throw new InvalidContractParameterError(parameter, [
      'Integer',
      'ByteArray',
    ]);
  }

  return common.fixedToDecimal(value, decimals || 0);
};
const toIntegerNullable = (createNullable(toInteger): To<?BigNumber>);

const toByteArray = (parameter: ContractParameter): Buffer => {
  switch (parameter.type) {
    case 'Signature':
      return JSONHelper.readBuffer(parameter.value);
    case 'Boolean':
      return parameter.value ? Buffer.alloc(1, 1) : Buffer.alloc(1, 0);
    case 'Integer':
      return utils.toSignedBuffer(new BN(parameter.value, 10));
    case 'Hash160':
      return common.uInt160ToBuffer(JSONHelper.readUInt160(parameter.value));
    case 'Hash256':
      return common.uInt256ToBuffer(JSONHelper.readUInt256(parameter.value));
    case 'ByteArray':
      return JSONHelper.readBuffer(parameter.value);
    case 'PublicKey':
      return common.ecPointToBuffer(JSONHelper.readECPoint(parameter.value));
    case 'String':
      return Buffer.from(parameter.value, 'utf8');
    case 'Array':
      throw new InvalidContractParameterError(parameter, [
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
      ]);
    case 'InteropInterface':
      return Buffer.alloc(0, 0);
    case 'Void':
      return Buffer.alloc(0, 0);
    default:
      // eslint-disable-next-line
      (parameter.type: empty);
      throw new Error(`Unknown parameter type: ${parameter.type}`);
  }
};
const toByteArrayNullable = (createNullable(toByteArray): To<?Buffer>);

const toBoolean = (parameter: ContractParameter): boolean => {
  if (parameter.type === 'Array') {
    return parameter.value.some(item => toBoolean(item));
  }

  return toByteArray(parameter).some(value => value !== 0);
};
const toBooleanNullable = (createNullable(toBoolean): To<?boolean>);

const toSignature = (parameter: ContractParameter): Buffer => {
  if (parameter.type === 'Signature') {
    return JSONHelper.readBuffer(parameter.value);
  }

  throw new InvalidContractParameterError(parameter, ['Signature']);
};
const toSignatureNullable = (createNullable(toSignature): To<?Buffer>);

function toArray<T>(
  parameter: ContractParameter,
  converter: (item: ContractParameter) => T,
): Array<T> {
  if (parameter.type === 'Array') {
    return parameter.value.map(item => converter(item));
  }

  throw new InvalidContractParameterError(parameter, ['Array']);
}
function toArrayNullable<T>(
  parameter: ContractParameter,
  converter: (item: ContractParameter) => T,
): ?Array<T> {
  try {
    return toArray(parameter, converter);
  } catch (error) {
    return null;
  }
}

function toInteropInterface(
  // eslint-disable-next-line
  parameter: ContractParameter,
): typeof undefined {
  return undefined;
}

function toVoid(
  // eslint-disable-next-line
  parameter: ContractParameter,
): typeof undefined {
  return undefined;
}

export default {
  toString,
  toStringNullable,
  toHash160,
  toHash160Nullable,
  toHash256,
  toHash256Nullable,
  toPublicKey,
  toPublicKeyNullable,
  toInteger,
  toIntegerNullable,
  toBoolean,
  toBooleanNullable,
  toByteArray,
  toByteArrayNullable,
  toSignature,
  toSignatureNullable,
  toArray,
  toArrayNullable,
  toVoid,
  toInteropInterface,
  byType: {
    String: {
      to: toString,
      toNullable: toStringNullable,
    },
    Hash160: {
      to: toHash160,
      toNullable: toHash160Nullable,
    },
    Hash256: {
      to: toHash256,
      toNullable: toHash256Nullable,
    },
    PublicKey: {
      to: toPublicKey,
      toNullable: toPublicKeyNullable,
    },
    Integer: {
      to: toInteger,
      toNullable: toIntegerNullable,
    },
    Boolean: {
      to: toBoolean,
      toNullable: toBooleanNullable,
    },
    ByteArray: {
      to: toByteArray,
      toNullable: toByteArrayNullable,
    },
    Signature: {
      to: toSignature,
      toNullable: toSignatureNullable,
    },
    Array: {
      to: toArray,
      toNullable: toArrayNullable,
    },
    InteropInterface: {
      to: toInteropInterface,
      toNullable: toInteropInterface,
    },
    Void: {
      to: toVoid,
      toNullable: toVoid,
    },
  },
};
