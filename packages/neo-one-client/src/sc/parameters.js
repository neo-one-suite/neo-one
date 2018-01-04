/* @flow */
import { JSONHelper, common, utils } from '@neo-one/client-core';

import type {
  ArrayABI,
  ContractParameter,
  Param,
  SignatureABI,
  BooleanABI,
  Hash160ABI,
  Hash256ABI,
  ByteArrayABI,
  PublicKeyABI,
  StringABI,
  InteropInterfaceABI,
  VoidABI,
  IntegerABI,
} from '../types'; // eslint-disable-line
import { InvalidContractParameterError } from '../errors';

const toByteArray = (contractParameter: ContractParameter): Buffer => {
  let value;
  switch (contractParameter.type) {
    case 'Signature':
      value = JSONHelper.readBuffer(contractParameter.value);
      break;
    case 'Boolean':
      value = contractParameter.value ? Buffer.alloc(1, 1) : Buffer.alloc(1, 0);
      break;
    case 'Integer':
      value = utils.toSignedBuffer(contractParameter.value);
      break;
    case 'Hash160':
      value = common.uInt160ToBuffer(
        JSONHelper.readUInt160(contractParameter.value),
      );
      break;
    case 'Hash256':
      value = common.uInt256ToBuffer(
        JSONHelper.readUInt256(contractParameter.value),
      );
      break;
    case 'ByteArray':
      value = JSONHelper.readBuffer(contractParameter.value);
      break;
    case 'PublicKey':
      value = common.ecPointToBuffer(
        JSONHelper.readECPoint(contractParameter.value),
      );
      break;
    case 'String':
      value = Buffer.from(contractParameter.value, 'utf8');
      break;
    case 'Array':
      throw new InvalidContractParameterError(contractParameter, [
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
      value = Buffer.alloc(0, 0);
      break;
    case 'Void':
      value = Buffer.alloc(0, 0);
      break;
    default:
      // eslint-disable-next-line
      (contractParameter.type: empty);
      throw new Error(
        `Unknown contractParameter type: ${contractParameter.type}`,
      );
  }

  return value;
};

const toBoolean = (contractParameter: ContractParameter) => {
  if (contractParameter.type === 'Array') {
    return contractParameter.value.some(item => toBoolean(item));
  }

  return toByteArray(contractParameter).some(value => value !== 0);
};

const contractParameters = {
  String: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: StringABI,
  ): string => {
    if (contractParameter.type === 'String') {
      return contractParameter.value;
    } else if (contractParameter.type === 'ByteArray') {
      return JSONHelper.readBuffer(contractParameter.value).toString('utf8');
    }

    throw new InvalidContractParameterError(contractParameter, [
      'String',
      'ByteArray',
    ]);
  },
  Hash160: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: Hash160ABI,
  ): string => {
    if (contractParameter.type === 'Hash160') {
      return contractParameter.value;
    } else if (contractParameter.type === 'ByteArray') {
      return common.uInt160ToString(
        JSONHelper.readUInt160(contractParameter.value),
      );
    }

    throw new InvalidContractParameterError(contractParameter, [
      'Hash160',
      'ByteArray',
    ]);
  },
  Hash256: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: Hash256ABI,
  ): string => {
    if (contractParameter.type === 'Hash256') {
      return contractParameter.value;
    } else if (contractParameter.type === 'ByteArray') {
      return common.uInt256ToString(
        JSONHelper.readUInt256(contractParameter.value),
      );
    }

    throw new InvalidContractParameterError(contractParameter, [
      'Hash256',
      'ByteArray',
    ]);
  },
  PublicKey: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: PublicKeyABI,
  ): string => {
    if (contractParameter.type === 'PublicKey') {
      return contractParameter.value;
    } else if (contractParameter.type === 'ByteArray') {
      return common.ecPointToString(
        JSONHelper.readECPoint(contractParameter.value),
      );
    }

    throw new InvalidContractParameterError(contractParameter, [
      'PublicKey',
      'ByteArray',
    ]);
  },
  Integer: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: IntegerABI,
  ): ?Param => {
    let value;
    if (contractParameter.type === 'Integer') {
      // eslint-disable-next-line
      value = contractParameter.value;
    } else if (contractParameter.type === 'ByteArray') {
      value = utils.fromSignedBuffer(
        JSONHelper.readBuffer(contractParameter.value),
      );
    } else {
      throw new InvalidContractParameterError(contractParameter, [
        'Integer',
        'ByteArray',
      ]);
    }

    return common.fixedToDecimal(value, parameter.decimals);
  },

  Boolean: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: BooleanABI,
  ): ?Param => toBoolean(contractParameter),

  Signature: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: SignatureABI,
  ): ?Param => {
    if (contractParameter.type === 'Signature') {
      return contractParameter.value;
    }

    throw new InvalidContractParameterError(contractParameter, ['Signature']);
  },
  ByteArray: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: ByteArrayABI,
  ): ?Param => toByteArray(contractParameter).toString('hex'),
  Array: (
    contractParameter: ContractParameter,
    parameter: ArrayABI,
  ): ?Param => {
    if (contractParameter.type !== 'Array') {
      throw new InvalidContractParameterError(contractParameter, ['Array']);
    }

    const { value } = parameter;
    const converter = contractParameters[value.type];
    return contractParameter.value.map(val =>
      converter(val, (value: $FlowFixMe)),
    );
  },
  InteropInterface: (
    // eslint-disable-next-line
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: InteropInterfaceABI,
  ): ?Param => undefined,
  Void: (
    // eslint-disable-next-line
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: VoidABI,
  ): ?Param => undefined,
};

export default contractParameters;
